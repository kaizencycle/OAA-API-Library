const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ethers } = require('ethers');
const { create } = require('ipfs-http-client');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// IPFS client
const ipfs = create({
  host: process.env.IPFS_HOST || 'localhost',
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || 'http'
});

// Ethereum provider and contract setup
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'http://localhost:8545');
const registryAddress = process.env.GIC_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000';
const registryABI = [
  "function getDomain(string memory name) external view returns (tuple(address owner, string ipfsHash, bytes32 integrityProof, uint256 expiresAt))",
  "function isAvailable(string memory name) external view returns (bool)"
];

const registry = new ethers.Contract(registryAddress, registryABI, provider);

// Cache for resolved domains
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get domain from registry
async function getDomainFromRegistry(domainName) {
  try {
    const domain = await registry.getDomain(domainName);
    return {
      owner: domain.owner,
      ipfsHash: domain.ipfsHash,
      integrityProof: domain.integrityProof,
      expiresAt: Number(domain.expiresAt)
    };
  } catch (error) {
    console.error('Error fetching domain from registry:', error);
    return null;
  }
}

// Helper function to fetch content from IPFS
async function fetchIPFSContent(ipfsHash) {
  try {
    const chunks = [];
    for await (const chunk of ipfs.cat(ipfsHash)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString();
  } catch (error) {
    console.error('Error fetching IPFS content:', error);
    return null;
  }
}

// Main resolution endpoint
app.get('/resolve/:domain', async (req, res) => {
  const { domain } = req.params;
  
  try {
    // Check cache first
    const cacheKey = domain.toLowerCase();
    const cached = domainCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Get domain from registry
    const domainData = await getDomainFromRegistry(domain);
    
    if (!domainData || domainData.owner === '0x0000000000000000000000000000000000000000') {
      return res.status(404).json({ 
        error: 'Domain not found',
        domain: domain 
      });
    }

    // Check if domain is expired
    if (Date.now() / 1000 > domainData.expiresAt) {
      return res.status(410).json({ 
        error: 'Domain expired',
        domain: domain,
        expiresAt: domainData.expiresAt
      });
    }

    // Fetch content from IPFS
    const content = await fetchIPFSContent(domainData.ipfsHash);
    
    if (!content) {
      return res.status(503).json({ 
        error: 'Content not available on IPFS',
        domain: domain,
        ipfsHash: domainData.ipfsHash
      });
    }

    const response = {
      domain: domain,
      owner: domainData.owner,
      ipfsHash: domainData.ipfsHash,
      integrityProof: domainData.integrityProof,
      expiresAt: domainData.expiresAt,
      content: content,
      resolvedAt: Date.now()
    };

    // Cache the response
    domainCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (error) {
    console.error('Error resolving domain:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Serve content directly (for .gic domains)
app.get('/:domain', async (req, res) => {
  const { domain } = req.params;
  
  try {
    const domainData = await getDomainFromRegistry(domain);
    
    if (!domainData || domainData.owner === '0x0000000000000000000000000000000000000000') {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>${domain}.gic - Not Found</title></head>
        <body>
          <h1>Domain Not Found</h1>
          <p>The domain <strong>${domain}.gic</strong> is not registered or has expired.</p>
          <p>Visit the <a href="/register">registration portal</a> to claim this domain.</p>
        </body>
        </html>
      `);
    }

    // Check if domain is expired
    if (Date.now() / 1000 > domainData.expiresAt) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>${domain}.gic - Expired</title></head>
        <body>
          <h1>Domain Expired</h1>
          <p>The domain <strong>${domain}.gic</strong> expired on ${new Date(domainData.expiresAt * 1000).toISOString()}.</p>
          <p>Visit the <a href="/renew">renewal portal</a> to renew this domain.</p>
        </body>
        </html>
      `);
    }

    // Fetch and serve content from IPFS
    const content = await fetchIPFSContent(domainData.ipfsHash);
    
    if (!content) {
      return res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head><title>${domain}.gic - Content Unavailable</title></head>
        <body>
          <h1>Content Unavailable</h1>
          <p>The content for <strong>${domain}.gic</strong> is not available on IPFS.</p>
          <p>IPFS Hash: <code>${domainData.ipfsHash}</code></p>
        </body>
        </html>
      `);
    }

    // Set appropriate headers
    res.setHeader('X-GIC-Domain', domain);
    res.setHeader('X-GIC-Owner', domainData.owner);
    res.setHeader('X-GIC-IPFS-Hash', domainData.ipfsHash);
    res.setHeader('X-GIC-Integrity-Proof', domainData.integrityProof);
    res.setHeader('X-GIC-Expires-At', domainData.expiresAt);
    
    // Try to determine content type
    if (content.includes('<!DOCTYPE html>') || content.includes('<html>')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (content.includes('{') && content.includes('}')) {
      res.setHeader('Content-Type', 'application/json');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }
    
    res.send(content);
  } catch (error) {
    console.error('Error serving domain:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>${domain}.gic - Error</title></head>
      <body>
        <h1>Server Error</h1>
        <p>An error occurred while serving <strong>${domain}.gic</strong>.</p>
        <p>Please try again later.</p>
      </body>
      </html>
    `);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'gic-gateway',
    timestamp: Date.now(),
    cache: {
      size: domainCache.size,
      ttl: CACHE_TTL
    }
  });
});

// Registry info endpoint
app.get('/registry/info', async (req, res) => {
  try {
    const isAvailable = await registry.isAvailable('test');
    res.json({
      registryAddress: registryAddress,
      connected: true,
      testAvailable: isAvailable
    });
  } catch (error) {
    res.status(500).json({
      registryAddress: registryAddress,
      connected: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[GIC Gateway] Server running on port ${PORT}`);
  console.log(`[GIC Gateway] Registry: ${registryAddress}`);
  console.log(`[GIC Gateway] IPFS: ${process.env.IPFS_HOST || 'localhost'}:${process.env.IPFS_PORT || 5001}`);
});

module.exports = app;