// pages/api/oaa/memory/search.ts
// Semantic search endpoint for OAA memory

import type { NextApiRequest, NextApiResponse } from 'next';
import { hmacValid } from '@/src/lib/crypto/hmac';
import { semanticSearch, findRelatedMemories, summarizeMemoryInsights } from '@/src/lib/memory/vectorStore';

interface SearchRequest {
  query: string;
  limit?: number;
  minSimilarity?: number;
  tags?: string[];
  includeMetadata?: boolean;
  generateInsights?: boolean;
  focusArea?: string;
}

interface SearchResponse {
  results: Array<{
    id: string;
    content: string;
    similarity: number;
    metadata?: Record<string, any>;
    timestamp: number;
  }>;
  insights?: string;
  total: number;
  query: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string }>
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
    query,
    limit = 10,
    minSimilarity = 0.7,
    tags = [],
    includeMetadata = true,
    generateInsights = false,
    focusArea
  }: SearchRequest = req.body;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    // Perform semantic search
    const results = await semanticSearch(query, {
      limit,
      minSimilarity,
      tags,
      includeMetadata
    });

    let insights: string | undefined;
    
    if (generateInsights && results.length > 0) {
      insights = await summarizeMemoryInsights(results, focusArea);
    }

    res.status(200).json({
      results,
      insights,
      total: results.length,
      query: query.trim()
    });
  } catch (error: any) {
    console.error('Memory search error:', error);
    res.status(500).json({
      error: 'search_failed',
      message: error?.message || 'Unknown error during search'
    });
  }
}