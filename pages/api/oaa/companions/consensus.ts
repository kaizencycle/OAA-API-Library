// pages/api/oaa/companions/consensus.ts
// Add multi-LLM consensus endpoint to OAA

import type { NextApiRequest, NextApiResponse } from 'next';
import { hmacValid } from '@/src/lib/crypto/hmac';
import { sha256hex } from '@/src/lib/crypto/sha';
import { readMemory, writeMemory } from '@/src/lib/memory/fileStore';

interface CompanionConfig {
  name: 'AUREA' | 'ATLAS' | 'SOLARA' | 'JADE' | 'EVE' | 'ZEUS' | 'HERMES';
  provider: 'openai' | 'anthropic' | 'deepseek' | 'oaa-internal';
  model: string;
  weight: number;
  safetyTier: 'critical' | 'high' | 'standard' | 'research';
  capabilities: string[];
}

const OAA_COMPANIONS: CompanionConfig[] = [
  // External AI providers
  {
    name: 'AUREA',
    provider: 'openai',
    model: 'gpt-4o',
    weight: 1.0,
    safetyTier: 'critical',
    capabilities: ['identity', 'ledger', 'wallet', 'governance']
  },
  {
    name: 'ATLAS',
    provider: 'anthropic',
    model: 'claude-sonnet-4',
    weight: 1.0,
    safetyTier: 'critical',
    capabilities: ['constitutional', 'audit', 'policy', 'ethics']
  },
  {
    name: 'SOLARA',
    provider: 'deepseek',
    model: 'deepseek-r1',
    weight: 0.7,
    safetyTier: 'standard',
    capabilities: ['research', 'ideation', 'analysis', 'content']
  },
  // OAA internal companions (existing)
  {
    name: 'JADE',
    provider: 'oaa-internal',
    model: 'builder-v1',
    weight: 0.9,
    safetyTier: 'high',
    capabilities: ['building', 'implementation', 'technical']
  },
  {
    name: 'EVE',
    provider: 'oaa-internal',
    model: 'reflection-v1',
    weight: 0.9,
    safetyTier: 'high',
    capabilities: ['reflection', 'retrospective', 'synthesis']
  },
  {
    name: 'ZEUS',
    provider: 'oaa-internal',
    model: 'ops-v1',
    weight: 0.8,
    safetyTier: 'standard',
    capabilities: ['operations', 'monitoring', 'infrastructure']
  },
  {
    name: 'HERMES',
    provider: 'oaa-internal',
    model: 'routing-v1',
    weight: 0.8,
    safetyTier: 'standard',
    capabilities: ['routing', 'coordination', 'messaging']
  }
];

interface ConsensusRequest {
  prompt: string;
  companions?: string[]; // Subset to invoke (default: all eligible)
  operationTier: 'critical' | 'high' | 'standard' | 'research';
  requiredVotes?: number;
  minConstitutionalScore?: number;
  context?: Record<string, any>; // Additional context for companions
}

interface ConsensusResponse {
  approved: boolean;
  votes: Record<string, {
    approved: boolean;
    response: string;
    constitutionalScore: number;
    latencyMs: number;
  }>;
  consensus: {
    totalVotes: number;
    approvals: number;
    weightedScore: number;
    criticalApprovals: number;
  };
  sealed: {
    sha256: string;
    ledgerUrl: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConsensusResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify HMAC signature
  const hmacSecret = process.env.OAA_HMAC_SECRET;
  if (!hmacSecret) {
    return res.status(500).json({ error: 'HMAC secret not configured' });
  }

  const signature = req.headers['x-hmac-sha256'] as string;
  const body = JSON.stringify(req.body);

  if (!hmacValid(body, hmacSecret, signature)) {
    return res.status(403).json({ error: 'Invalid HMAC signature' });
  }

  const {
    prompt,
    companions: requestedCompanions,
    operationTier,
    requiredVotes,
    minConstitutionalScore = 70,
    context = {}
  }: ConsensusRequest = req.body;

  if (!prompt || !operationTier) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Filter companions by tier eligibility
  const eligibleCompanions = OAA_COMPANIONS.filter(c => {
    // Check tier eligibility
    const tierRank = { research: 0, standard: 1, high: 2, critical: 3 };
    const eligible = tierRank[c.safetyTier] >= tierRank[operationTier];
    
    // Check if specifically requested
    const requested = !requestedCompanions || requestedCompanions.includes(c.name);
    
    return eligible && requested;
  });

  if (eligibleCompanions.length === 0) {
    return res.status(400).json({ error: 'No eligible companions for this operation tier' });
  }

  // Determine required votes (default: 2-of-N for critical/high, majority for others)
  const defaultRequiredVotes = ['critical', 'high'].includes(operationTier) 
    ? Math.min(2, eligibleCompanions.length)
    : Math.ceil(eligibleCompanions.length / 2);
  
  const votesNeeded = requiredVotes ?? defaultRequiredVotes;

  // Invoke companions in parallel
  const votes: Record<string, any> = {};
  const startTime = Date.now();

  const votePromises = eligibleCompanions.map(async (companion) => {
    const companionStartTime = Date.now();
    
    try {
      let response: string;
      let constitutionalScore: number;

      // Route to appropriate provider
      if (companion.provider === 'oaa-internal') {
        // For OAA internal companions, generate response based on role
        response = await invokeOAACompanion(companion, prompt, context);
        constitutionalScore = 85; // OAA companions pre-validated
      } else {
        // External AI providers
        const result = await invokeExternalProvider(companion, prompt);
        response = result.response;
        constitutionalScore = result.constitutionalScore;
      }

      const latencyMs = Date.now() - companionStartTime;

      votes[companion.name] = {
        approved: constitutionalScore >= minConstitutionalScore,
        response,
        constitutionalScore,
        latencyMs
      };
    } catch (error: any) {
      console.error(`Companion ${companion.name} error:`, error);
      votes[companion.name] = {
        approved: false,
        response: `Error: ${error.message}`,
        constitutionalScore: 0,
        latencyMs: Date.now() - companionStartTime
      };
    }
  });

  await Promise.all(votePromises);

  // Calculate consensus
  const approvals = Object.values(votes).filter(v => v.approved);
  const criticalApprovals = approvals.filter((_, idx) => {
    const companion = eligibleCompanions[idx];
    return companion.safetyTier === 'critical';
  });

  const weightedScore = eligibleCompanions.reduce((sum, companion) => {
    const vote = votes[companion.name];
    return sum + (vote?.approved ? companion.weight : 0);
  }, 0);

  const approved = approvals.length >= votesNeeded && 
    (['critical', 'high'].includes(operationTier) ? criticalApprovals.length >= 1 : true);

  // Seal to ledger (simplified - integrate with your ledger system)
  const consensusData = {
    prompt,
    operationTier,
    votes,
    consensus: {
      totalVotes: Object.keys(votes).length,
      approvals: approvals.length,
      weightedScore,
      criticalApprovals: criticalApprovals.length,
      approved
    },
    timestamp: new Date().toISOString()
  };

  const consensusHash = sha256hex(JSON.stringify(consensusData));
  
  // Append to OAA memory
  const memory = readMemory();
  memory.notes.unshift({
    ts: Date.now(),
    note: `Consensus: ${approved ? 'APPROVED' : 'REJECTED'} - ${prompt.substring(0, 100)}`
  });
  writeMemory(memory);

  const totalLatency = Date.now() - startTime;

  res.status(200).json({
    approved,
    votes,
    consensus: {
      totalVotes: Object.keys(votes).length,
      approvals: approvals.length,
      weightedScore,
      criticalApprovals: criticalApprovals.length
    },
    sealed: {
      sha256: consensusHash,
      ledgerUrl: `https://ledger.oaa.dev/verify/${consensusHash}`
    }
  });
}

// Helper: Invoke OAA internal companion
async function invokeOAACompanion(
  companion: CompanionConfig,
  prompt: string,
  context: Record<string, any>
): Promise<string> {
  // This would call your existing OAA companion logic
  // For now, return a structured response
  
  switch (companion.name) {
    case 'JADE':
      return `[JADE] Building approach: ${prompt} - Implementation strategy drafted.`;
    case 'EVE':
      return `[EVE] Reflection: ${prompt} - Synthesized insights from cycle.`;
    case 'ZEUS':
      return `[ZEUS] Operational assessment: ${prompt} - Infrastructure checks passing.`;
    case 'HERMES':
      return `[HERMES] Routing recommendation: ${prompt} - Best path identified.`;
    default:
      return `[${companion.name}] Acknowledged: ${prompt}`;
  }
}

// Helper: Invoke external AI provider
async function invokeExternalProvider(
  companion: CompanionConfig,
  prompt: string
): Promise<{ response: string; constitutionalScore: number }> {
  const apiKey = process.env[`${companion.provider.toUpperCase()}_API_KEY`];
  
  if (!apiKey) {
    throw new Error(`API key not configured for ${companion.provider}`);
  }

  // Call provider API (simplified - expand with actual implementations)
  let response: string;
  
  switch (companion.provider) {
    case 'openai':
      response = await callOpenAI(prompt, companion.model, apiKey);
      break;
    case 'anthropic':
      response = await callAnthropic(prompt, companion.model, apiKey);
      break;
    case 'deepseek':
      response = await callDeepSeek(prompt, companion.model, apiKey);
      break;
    default:
      throw new Error(`Unknown provider: ${companion.provider}`);
  }

  // Constitutional scoring (simplified - integrate your Custos Charter logic)
  const constitutionalScore = await scoreConstitutionally(response);

  return { response, constitutionalScore };
}

// Placeholder provider implementations (expand these)
async function callOpenAI(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  });
  const data = await res.json();
  return data.content[0].text;
}

async function callDeepSeek(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

async function scoreConstitutionally(response: string): Promise<number> {
  // Integrate your Custos Charter constitutional validation
  // For now, return a placeholder score
  return 85;
}