// oaa/agents.ts - AI Companions .gic domain management
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';

export interface AgentDomain {
  name: string;
  owner: string;
  ipfsHash: string;
  integrityProof: string;
  expiresAt: number;
  content?: string;
}

export interface AgentHomepage {
  agentId: string;
  domain: string;
  title: string;
  description: string;
  content: string;
  ipfsHash: string;
  lastUpdated: number;
}

// IPFS client for content storage
const ipfs = create({
  host: process.env.IPFS_HOST || 'localhost',
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || 'http'
});

// GIC Registry contract interface
const registryABI = [
  "function getDomain(string memory name) external view returns (tuple(address owner, string ipfsHash, bytes32 integrityProof, uint256 expiresAt))",
  "function isAvailable(string memory name) external view returns (bool)",
  "function register(string calldata name, string calldata ipfsHash, bytes32 integrityProof) external payable",
  "function updateRecords(string calldata name, string calldata ipfsHash, bytes32 integrityProof) external",
  "function renew(string calldata name) external payable"
];

export class AgentDomainManager {
  private provider: ethers.JsonRpcProvider;
  private registry: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'http://localhost:8545');
    this.registry = new ethers.Contract(
      process.env.GIC_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
      registryABI,
      this.provider
    );
    
    if (process.env.PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      this.registry = this.registry.connect(this.wallet);
    }
  }

  async checkDomainAvailability(domainName: string): Promise<boolean> {
    try {
      return await this.registry.isAvailable(domainName);
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  }

  async getDomain(domainName: string): Promise<AgentDomain | null> {
    try {
      const domain = await this.registry.getDomain(domainName);
      return {
        name: domainName,
        owner: domain.owner,
        ipfsHash: domain.ipfsHash,
        integrityProof: domain.integrityProof,
        expiresAt: Number(domain.expiresAt)
      };
    } catch (error) {
      console.error('Error fetching domain:', error);
      return null;
    }
  }

  async uploadToIPFS(content: string): Promise<string> {
    try {
      const result = await ipfs.add(content);
      return result.cid.toString();
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  async createIntegrityProof(content: string, domainName: string): Promise<string> {
    // Create a simple integrity proof by hashing content + domain + timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${content}${domainName}${timestamp}`;
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  async registerDomain(domainName: string, content: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.wallet) {
        return { success: false, error: 'No wallet configured' };
      }

      // Upload content to IPFS
      const ipfsHash = await this.uploadToIPFS(content);
      
      // Create integrity proof
      const integrityProof = await this.createIntegrityProof(content, domainName);
      
      // Register domain
      const basePrice = ethers.parseEther("0.01");
      const tx = await this.registry.register(domainName, ipfsHash, integrityProof, { value: basePrice });
      const receipt = await tx.wait();
      
      return { 
        success: true, 
        txHash: receipt.hash 
      };
    } catch (error) {
      console.error('Error registering domain:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async updateDomainContent(domainName: string, content: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.wallet) {
        return { success: false, error: 'No wallet configured' };
      }

      // Upload new content to IPFS
      const ipfsHash = await this.uploadToIPFS(content);
      
      // Create new integrity proof
      const integrityProof = await this.createIntegrityProof(content, domainName);
      
      // Update domain records
      const tx = await this.registry.updateRecords(domainName, ipfsHash, integrityProof);
      const receipt = await tx.wait();
      
      return { 
        success: true, 
        txHash: receipt.hash 
      };
    } catch (error) {
      console.error('Error updating domain content:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async createAgentHomepage(agentId: string, domain: string, title: string, description: string, content: string): Promise<AgentHomepage> {
    const homepage: AgentHomepage = {
      agentId,
      domain,
      title,
      description,
      content,
      ipfsHash: '',
      lastUpdated: Date.now()
    };

    // Upload to IPFS
    const ipfsHash = await this.uploadToIPFS(content);
    homepage.ipfsHash = ipfsHash;

    return homepage;
  }

  generateHomepageHTML(homepage: AgentHomepage): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${homepage.title} - ${homepage.domain}.gic</title>
    <meta name="description" content="${homepage.description}">
    <meta name="gic-domain" content="${homepage.domain}">
    <meta name="gic-agent" content="${homepage.agentId}">
    <meta name="gic-ipfs" content="${homepage.ipfsHash}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .domain {
            font-size: 2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .agent-id {
            color: #666;
            font-size: 1.1em;
        }
        .content {
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .gic-badge {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="domain">${homepage.domain}.gic <span class="gic-badge">GIC</span></div>
            <div class="agent-id">AI Companion: ${homepage.agentId}</div>
        </div>
        <div class="content">
            ${homepage.content}
        </div>
        <div class="footer">
            <p>Powered by the Global Integrity Citizen (.gic) network</p>
            <p>IPFS Hash: <code>${homepage.ipfsHash}</code></p>
            <p>Last Updated: ${new Date(homepage.lastUpdated).toISOString()}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Export singleton instance
export const agentDomainManager = new AgentDomainManager();