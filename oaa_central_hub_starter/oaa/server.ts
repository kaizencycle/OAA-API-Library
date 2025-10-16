// oaa/server.ts
import express from "express";
import bodyParser from "body-parser";
import { plan, act } from "./hub";
import { agentDomainManager } from "./agents";

const app = express();
app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// OAA Core Routes
app.post("/oaa/plan", async (req, res) => {
  const p = await plan(req.body);
  res.json({ ok: true, plan: p });
});

app.post("/oaa/act", async (req, res) => {
  const out = await act(req.body);
  res.json(out);
});

// Agents Homepage Routes
app.get("/agents/homepage", (req, res) => {
  res.json({
    ok: true,
    message: "AI Companions Homepage Portal",
    endpoints: {
      register: "POST /agents/homepage/register",
      update: "POST /agents/homepage/update",
      check: "GET /agents/homepage/check/:domain",
      info: "GET /agents/homepage/info/:domain"
    },
    description: "Manage .gic domains for AI Companions"
  });
});

app.post("/agents/homepage/register", async (req, res) => {
  try {
    const { domain, agentId, title, description, content } = req.body;
    
    if (!domain || !agentId || !title || !description || !content) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: domain, agentId, title, description, content"
      });
    }

    // Check if domain is available
    const available = await agentDomainManager.checkDomainAvailability(domain);
    if (!available) {
      return res.status(409).json({
        ok: false,
        error: "Domain is not available",
        domain: domain
      });
    }

    // Create homepage
    const homepage = await agentDomainManager.createAgentHomepage(
      agentId,
      domain,
      title,
      description,
      content
    );
    
    // Generate HTML
    const htmlContent = agentDomainManager.generateHomepageHTML(homepage);
    
    // Register domain
    const result = await agentDomainManager.registerDomain(domain, htmlContent);
    
    if (result.success) {
      res.json({
        ok: true,
        domain: domain,
        agentId: agentId,
        ipfsHash: homepage.ipfsHash,
        txHash: result.txHash,
        message: `Agent ${agentId} homepage registered at ${domain}.gic`,
        url: `https://${domain}.gic`
      });
    } else {
      res.status(500).json({
        ok: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.post("/agents/homepage/update", async (req, res) => {
  try {
    const { domain, agentId, title, description, content } = req.body;
    
    if (!domain || !agentId || !title || !description || !content) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: domain, agentId, title, description, content"
      });
    }

    // Create updated homepage
    const homepage = await agentDomainManager.createAgentHomepage(
      agentId,
      domain,
      title,
      description,
      content
    );
    
    // Generate HTML
    const htmlContent = agentDomainManager.generateHomepageHTML(homepage);
    
    // Update domain content
    const result = await agentDomainManager.updateDomainContent(domain, htmlContent);
    
    if (result.success) {
      res.json({
        ok: true,
        domain: domain,
        agentId: agentId,
        ipfsHash: homepage.ipfsHash,
        txHash: result.txHash,
        message: `Agent ${agentId} homepage updated at ${domain}.gic`,
        url: `https://${domain}.gic`
      });
    } else {
      res.status(500).json({
        ok: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/agents/homepage/check/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const available = await agentDomainManager.checkDomainAvailability(domain);
    
    res.json({
      ok: true,
      domain: domain,
      available: available
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/agents/homepage/info/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const domainInfo = await agentDomainManager.getDomain(domain);
    
    if (!domainInfo) {
      return res.status(404).json({
        ok: false,
        error: "Domain not found",
        domain: domain
      });
    }
    
    res.json({
      ok: true,
      domain: domainInfo
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// GIC Gateway Proxy Routes
app.get("/gic-gateway/resolve/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    const gatewayUrl = process.env.GIC_GATEWAY_URL || 'http://localhost:3001';
    const response = await fetch(`${gatewayUrl}/resolve/${domain}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.get("/gic-gateway/health", async (req, res) => {
  try {
    const gatewayUrl = process.env.GIC_GATEWAY_URL || 'http://localhost:3001';
    const response = await fetch(`${gatewayUrl}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`[OAA Hub] listening on :${port}`);
  console.log(`[OAA Hub] Agents Homepage: http://localhost:${port}/agents/homepage`);
  console.log(`[OAA Hub] GIC Gateway Proxy: http://localhost:${port}/gic-gateway/`);
});
