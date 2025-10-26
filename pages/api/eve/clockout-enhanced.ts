// pages/api/eve/clockout-enhanced.ts
// Enhanced Eve clockout with AI synthesis and pattern detection

import type { NextApiRequest, NextApiResponse } from 'next';
import { hmacValid } from '@/src/lib/crypto/hmac';
import { sha256hex } from '@/src/lib/crypto/sha';
import { readMemory, writeMemory } from '@/src/lib/memory/fileStore';
import { semanticSearch, summarizeMemoryInsights } from '@/src/lib/memory/vectorStore';

interface EnhancedClockOutRequest {
  cycle: string;
  companion: string;
  wins: string[];
  blocks: string[];
  tomorrowIntent: string[];
  meta?: {
    tz?: string;
    duration_hours?: number;
    context?: Record<string, any>;
  };
}

interface EnhancedClockOutResponse {
  cycle: string;
  digest: string;
  sha256: string;
  sealed: {
    ledgerUrl: string;
    timestamp: string;
  };
  aiInsights: {
    patternAnalysis: string;
    recommendations: string[];
    relatedCycles: Array<{
      cycle: string;
      similarity: number;
      keyWins: string[];
    }>;
    blockerTrends: {
      recurring: string[];
      resolved: string[];
      newThisWeek: string[];
    };
    momentumScore: number; // 0-100
  };
  nextCycleStub: {
    cycle: string;
    suggestedIntent: string[];
    carryForward: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnhancedClockOutResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify HMAC
  const hmacSecret = process.env.EVE_HMAC_SECRET || process.env.OAA_HMAC_SECRET;
  if (!hmacSecret) {
    return res.status(500).json({ error: 'HMAC secret not configured' });
  }

  const signature = req.headers['x-hmac-sha256'] as string;
  const body = JSON.stringify(req.body);

  if (!hmacValid(body, hmacSecret, signature)) {
    return res.status(403).json({ error: 'Invalid HMAC signature' });
  }

  const {
    cycle,
    companion,
    wins,
    blocks,
    tomorrowIntent,
    meta = {}
  }: EnhancedClockOutRequest = req.body;

  if (!cycle || !companion || !wins || !blocks || !tomorrowIntent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate human-readable digest
  const digest = generateDigest({ cycle, companion, wins, blocks, tomorrowIntent, meta });
  
  // Calculate SHA256
  const cycleHash = sha256hex(digest);

  // --- AI ENHANCEMENT: Pattern Analysis ---
  const aiInsights = await analyzeWithAI(cycle, { wins, blocks, tomorrowIntent });

  // Store to memory with AI insights
  const memory = readMemory();
  memory.notes.unshift({
    ts: Date.now(),
    note: digest
  });
  writeMemory(memory);

  // Seal to ledger (simplified - integrate with your ledger system)
  const ledgerResult = {
    verificationUrl: `https://ledger.oaa.dev/verify/${cycleHash}`
  };

  // Generate next cycle stub
  const nextCycleNumber = parseInt(cycle.split('-')[1]) + 1;
  const nextCycle = `C-${nextCycleNumber}`;
  
  const nextCycleStub = {
    cycle: nextCycle,
    suggestedIntent: aiInsights.recommendations.slice(0, 3),
    carryForward: blocks.filter(b => aiInsights.blockerTrends.recurring.includes(b))
  };

  // Auto-create next cycle stub in memory
  memory.notes.unshift({
    ts: Date.now(),
    note: `[${nextCycle}] Stub created. Suggested intent: ${nextCycleStub.suggestedIntent.join('; ')}`
  });
  writeMemory(memory);

  res.status(200).json({
    cycle,
    digest,
    sha256: cycleHash,
    sealed: {
      ledgerUrl: ledgerResult.verificationUrl,
      timestamp: new Date().toISOString()
    },
    aiInsights,
    nextCycleStub
  });
}

/**
 * Generate human-readable digest
 */
function generateDigest(data: {
  cycle: string;
  companion: string;
  wins: string[];
  blocks: string[];
  tomorrowIntent: string[];
  meta: any;
}): string {
  const { cycle, companion, wins, blocks, tomorrowIntent, meta } = data;
  
  return `
[${cycle}] ${companion.toUpperCase()} Clock-Out
${'='.repeat(50)}

✅ WINS:
${wins.map((w, i) => `${i + 1}. ${w}`).join('\n')}

🚧 BLOCKS:
${blocks.map((b, i) => `${i + 1}. ${b}`).join('\n')}

🎯 TOMORROW:
${tomorrowIntent.map((t, i) => `${i + 1}. ${t}`).join('\n')}

⏰ Meta: ${meta.tz || 'UTC'} | Duration: ${meta.duration_hours || 'N/A'}h
${'='.repeat(50)}
`.trim();
}

/**
 * AI-powered cycle analysis
 */
async function analyzeWithAI(
  cycle: string,
  data: {
    wins: string[];
    blocks: string[];
    tomorrowIntent: string[];
  }
): Promise<EnhancedClockOutResponse['aiInsights']> {
  // 1. Find related past cycles using semantic search
  const relatedCycles = await findRelatedCycles(data);

  // 2. Analyze blocker trends
  const blockerTrends = await analyzeBlockerTrends(data.blocks);

  // 3. Calculate momentum score
  const momentumScore = calculateMomentumScore(data, blockerTrends);

  // 4. Generate AI recommendations
  const recommendations = await generateRecommendations(data, blockerTrends, relatedCycles);

  // 5. Pattern analysis using ATLAS
  const patternAnalysis = await synthesizePatterns(data, relatedCycles);

  return {
    patternAnalysis,
    recommendations,
    relatedCycles,
    blockerTrends,
    momentumScore
  };
}

/**
 * Find semantically similar past cycles
 */
async function findRelatedCycles(
  data: { wins: string[]; blocks: string[]; tomorrowIntent: string[] }
): Promise<Array<{ cycle: string; similarity: number; keyWins: string[] }>> {
  // Combine current cycle content for embedding
  const content = [...data.wins, ...data.blocks, ...data.tomorrowIntent].join(' ');
  
  // Search past clockouts
  const relatedMemories = await semanticSearch(content, {
    limit: 5,
    minSimilarity: 0.7,
    tags: ['eve-clockout']
  });

  return relatedMemories.map(m => ({
    cycle: m.note.match(/\[C-\d+\]/)?.[0] || 'Unknown',
    similarity: Math.round((m.similarity || 0) * 100) / 100,
    keyWins: extractWins(m.note)
  }));
}

/**
 * Extract wins from digest text
 */
function extractWins(digest: string): string[] {
  const winsSection = digest.match(/✅ WINS:\n([\s\S]*?)(?=\n\n|$)/);
  if (!winsSection) return [];
  
  return winsSection[1]
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3); // Top 3 wins
}

/**
 * Analyze blocker trends over time
 */
async function analyzeBlockerTrends(
  currentBlocks: string[]
): Promise<{
  recurring: string[];
  resolved: string[];
  newThisWeek: string[];
}> {
  const memory = readMemory();
  
  // Get last 7 cycles of clockouts
  const recentClockouts = memory.notes
    .filter(n => n.note.includes('Clock-Out'))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 7);

  // Extract all past blocks
  const pastBlocks = recentClockouts.flatMap(co => 
    extractBlocks(co.note)
  );

  // Categorize current blocks
  const recurring: string[] = [];
  const newThisWeek: string[] = [];

  for (const block of currentBlocks) {
    const blockLower = block.toLowerCase();
    const appearedBefore = pastBlocks.some(pb => 
      pb.toLowerCase().includes(blockLower) || blockLower.includes(pb.toLowerCase())
    );

    if (appearedBefore) {
      recurring.push(block);
    } else {
      newThisWeek.push(block);
    }
  }

  // Find resolved blocks (in past, not in current)
  const currentBlocksLower = currentBlocks.map(b => b.toLowerCase());
  const resolved = [...new Set(pastBlocks)]
    .filter(pb => !currentBlocksLower.some(cb => 
      cb.includes(pb.toLowerCase()) || pb.toLowerCase().includes(cb)
    ))
    .slice(0, 3);

  return { recurring, resolved, newThisWeek };
}

/**
 * Extract blocks from digest text
 */
function extractBlocks(digest: string): string[] {
  const blocksSection = digest.match(/🚧 BLOCKS:\n([\s\S]*?)(?=\n\n|$)/);
  if (!blocksSection) return [];
  
  return blocksSection[1]
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Calculate momentum score
 */
function calculateMomentumScore(
  data: { wins: string[]; blocks: string[] },
  trends: { recurring: string[]; resolved: string[]; newThisWeek: string[] }
): number {
  let score = 50; // Base score

  // Wins boost momentum
  score += data.wins.length * 8;

  // Blocks reduce momentum
  score -= data.blocks.length * 5;

  // Recurring blocks are more damaging
  score -= trends.recurring.length * 10;

  // Resolved blocks boost momentum
  score += trends.resolved.length * 12;

  // New blocks have moderate impact
  score -= trends.newThisWeek.length * 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate AI recommendations using ATLAS
 */
async function generateRecommendations(
  data: { wins: string[]; blocks: string[]; tomorrowIntent: string[] },
  trends: { recurring: string[]; resolved: string[]; newThisWeek: string[] },
  relatedCycles: any[]
): Promise<string[]> {
  const atlasKey = process.env.ANTHROPIC_API_KEY;
  
  if (!atlasKey) {
    return ['Review recurring blockers', 'Build on today\'s wins', 'Clarify tomorrow\'s priorities'];
  }

  const prompt = `You are EVE, the reflection companion in OAA. Analyze this cycle and provide 3-5 actionable recommendations.

Today's Wins:
${data.wins.map((w, i) => `${i + 1}. ${w}`).join('\n')}

Today's Blocks:
${data.blocks.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Tomorrow's Intent:
${data.tomorrowIntent.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Blocker Trends:
- Recurring: ${trends.recurring.join(', ') || 'None'}
- Resolved: ${trends.resolved.join(', ') || 'None'}
- New: ${trends.newThisWeek.join(', ') || 'None'}

Provide 3-5 specific, actionable recommendations. Format as JSON array:
["recommendation 1", "recommendation 2", ...]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': atlasKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    });
    
    const responseData = await response.json();
    return JSON.parse(responseData.content[0].text);
  } catch {
    return ['Review recurring blockers', 'Build on today\'s wins', 'Clarify tomorrow\'s priorities'];
  }
}

/**
 * Synthesize patterns across cycles using ATLAS
 */
async function synthesizePatterns(
  data: { wins: string[]; blocks: string[]; tomorrowIntent: string[] },
  relatedCycles: any[]
): Promise<string> {
  const atlasKey = process.env.ANTHROPIC_API_KEY;
  
  if (!atlasKey) {
    return 'Pattern analysis unavailable';
  }

  const prompt = `As EVE, analyze patterns across these related cycles:

Current Cycle:
Wins: ${data.wins.join('; ')}
Blocks: ${data.blocks.join('; ')}

Related Past Cycles:
${relatedCycles.map(rc => `- ${rc.cycle} (similarity: ${rc.similarity}): ${rc.keyWins.join('; ')}`).join('\n')}

Provide a 2-3 sentence pattern analysis identifying recurring themes or insights.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': atlasKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      })
    });
    
    const responseData = await response.json();
    return responseData.content[0].text;
  } catch {
    return 'Pattern analysis unavailable';
  }
}