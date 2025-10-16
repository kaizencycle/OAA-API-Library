// oaa/registry.ts
import { agentDomainManager, AgentHomepage } from './agents';

export type Tool = { name: string; call: (args:any)=>Promise<any> };
export type Lab  = { id: string; routes: string[] };

export const labs: Lab[] = [
  { id: "lab7-oaa", routes: ["/oaa", "/api/oaa/*"] },
  { id: "lab4-frontend", routes: ["/", "/oaa"] },
  { id: "lab6-citizen-shield", routes: ["/gateway/*", "/agent/*"] },
  { id: "civic-ledger", routes: ["/ledger/*"] },
  { id: "gic-indexer", routes: ["/gic/*"] },
  { id: "gic-gateway", routes: ["/gic-gateway/*"] },
  { id: "agents-homepage", routes: ["/agents/*"] },
];

// Prefer the real implementation if present:
let webDataScout: any;
try {
  webDataScout = require("../lib/webDataScout").extract;
} catch {
  // Fallback stub to avoid build errors; replace with real lib/webDataScout.ts.
  webDataScout = async (args: any) => ({
    ok: true,
    data: { title: "Stub Scout", note: "Replace with lib/webDataScout.ts", args },
    meta: { url: args?.url || "", fetchedAt: new Date().toISOString(), provider: "stub" }
  });
}

export const tools: Record<string, Tool> = {
  webDataScout: { name: "webDataScout", call: webDataScout },
  
  // GIC Domain Management Tools
  checkDomainAvailability: { 
    name: "checkDomainAvailability", 
    call: async (args: { domain: string }) => {
      try {
        const available = await agentDomainManager.checkDomainAvailability(args.domain);
        return { ok: true, available, domain: args.domain };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }
  },
  
  getDomainInfo: { 
    name: "getDomainInfo", 
    call: async (args: { domain: string }) => {
      try {
        const domainInfo = await agentDomainManager.getDomain(args.domain);
        return { ok: true, domain: domainInfo };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }
  },
  
  registerAgentDomain: { 
    name: "registerAgentDomain", 
    call: async (args: { 
      domain: string; 
      agentId: string; 
      title: string; 
      description: string; 
      content: string 
    }) => {
      try {
        // Create homepage
        const homepage = await agentDomainManager.createAgentHomepage(
          args.agentId,
          args.domain,
          args.title,
          args.description,
          args.content
        );
        
        // Generate HTML
        const htmlContent = agentDomainManager.generateHomepageHTML(homepage);
        
        // Register domain
        const result = await agentDomainManager.registerDomain(args.domain, htmlContent);
        
        if (result.success) {
          return { 
            ok: true, 
            domain: args.domain,
            agentId: args.agentId,
            ipfsHash: homepage.ipfsHash,
            txHash: result.txHash,
            message: `Agent ${args.agentId} homepage registered at ${args.domain}.gic`
          };
        } else {
          return { ok: false, error: result.error };
        }
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }
  },
  
  updateAgentDomain: { 
    name: "updateAgentDomain", 
    call: async (args: { 
      domain: string; 
      agentId: string; 
      title: string; 
      description: string; 
      content: string 
    }) => {
      try {
        // Create updated homepage
        const homepage = await agentDomainManager.createAgentHomepage(
          args.agentId,
          args.domain,
          args.title,
          args.description,
          args.content
        );
        
        // Generate HTML
        const htmlContent = agentDomainManager.generateHomepageHTML(homepage);
        
        // Update domain content
        const result = await agentDomainManager.updateDomainContent(args.domain, htmlContent);
        
        if (result.success) {
          return { 
            ok: true, 
            domain: args.domain,
            agentId: args.agentId,
            ipfsHash: homepage.ipfsHash,
            txHash: result.txHash,
            message: `Agent ${args.agentId} homepage updated at ${args.domain}.gic`
          };
        } else {
          return { ok: false, error: result.error };
        }
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }
  }
};
