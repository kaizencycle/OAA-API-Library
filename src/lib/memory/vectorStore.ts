// src/lib/memory/vectorStore.ts
// Vector memory search with semantic search capabilities

import { readMemory } from './fileStore';

interface VectorMemory {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  timestamp: number;
}

interface SearchOptions {
  limit?: number;
  minSimilarity?: number;
  tags?: string[];
  includeMetadata?: boolean;
}

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

// In-memory vector store (in production, use a proper vector database)
let vectorStore: VectorMemory[] = [];

/**
 * Add memory with vector embedding
 */
export async function addMemoryWithVector(
  content: string,
  tag: string = 'general',
  metadata: Record<string, any> = {}
): Promise<string> {
  const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate embedding using OpenAI
  const embedding = await generateEmbedding(content);
  
  const vectorMemory: VectorMemory = {
    id,
    content,
    embedding,
    metadata: {
      tag,
      ...metadata,
      timestamp: Date.now()
    },
    timestamp: Date.now()
  };
  
  vectorStore.push(vectorMemory);
  
  // Also add to regular memory store
  const memory = readMemory();
  memory.notes.unshift({
    ts: Date.now(),
    note: `[${tag}] ${content}`
  });
  
  return id;
}

/**
 * Semantic search across memory
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = 10,
    minSimilarity = 0.7,
    tags = [],
    includeMetadata = true
  } = options;
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Calculate similarities
  const results = vectorStore
    .map(memory => ({
      ...memory,
      similarity: cosineSimilarity(queryEmbedding, memory.embedding)
    }))
    .filter(memory => {
      // Filter by similarity threshold
      if (memory.similarity < minSimilarity) return false;
      
      // Filter by tags if specified
      if (tags.length > 0) {
        const memoryTag = memory.metadata.tag;
        if (!tags.includes(memoryTag)) return false;
      }
      
      return true;
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(memory => ({
      id: memory.id,
      content: memory.content,
      similarity: memory.similarity,
      metadata: includeMetadata ? memory.metadata : undefined,
      timestamp: memory.timestamp
    }));
  
  return results;
}

/**
 * Find related memories based on content similarity
 */
export async function findRelatedMemories(
  content: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  return semanticSearch(content, {
    ...options,
    minSimilarity: 0.6
  });
}

/**
 * Summarize memory insights using AI
 */
export async function summarizeMemoryInsights(
  memories: SearchResult[],
  focusArea?: string
): Promise<string> {
  const atlasKey = process.env.ANTHROPIC_API_KEY;
  
  if (!atlasKey) {
    return 'AI insights unavailable (API key not configured)';
  }
  
  const memoryTexts = memories
    .slice(0, 10) // Limit to top 10 for context
    .map(m => `[${m.timestamp}] ${m.content}`)
    .join('\n\n');
  
  const prompt = `As ATLAS, analyze these OAA memory patterns and provide insights:

${memoryTexts}

${focusArea ? `Focus area: ${focusArea}` : ''}

Provide 2-3 sentences identifying key patterns, trends, or insights.`;

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
    
    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating memory insights:', error);
    return 'Unable to generate insights at this time';
  }
}

/**
 * Auto-tag memory based on content analysis
 */
export async function autoTagMemory(content: string): Promise<string[]> {
  const atlasKey = process.env.ANTHROPIC_API_KEY;
  
  if (!atlasKey) {
    return ['general'];
  }
  
  const prompt = `Analyze this OAA memory content and suggest 1-3 relevant tags from this list:
- ops (operational)
- reflection (insights/retrospectives)
- technical (implementation)
- consensus (decisions/agreements)
- cycle (daily cycles)
- blocker (obstacles)
- win (achievements)
- general (other)

Content: ${content}

Respond with only the tags, comma-separated.`;

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
        max_tokens: 100
      })
    });
    
    const data = await response.json();
    const tags = data.content[0].text
      .split(',')
      .map((tag: string) => tag.trim().toLowerCase())
      .filter((tag: string) => tag.length > 0);
    
    return tags.length > 0 ? tags : ['general'];
  } catch (error) {
    console.error('Error auto-tagging memory:', error);
    return ['general'];
  }
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    // Fallback: simple hash-based embedding
    return generateFallbackEmbedding(text);
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding generation
 */
function generateFallbackEmbedding(text: string): number[] {
  // Simple hash-based embedding (not semantic, but consistent)
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate 1536-dimensional vector (matching OpenAI's embedding size)
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < 1536; i++) {
    embedding[i] = Math.sin(hash + i) * 0.1;
  }
  
  return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Load existing memories into vector store
 */
export async function loadExistingMemories(): Promise<void> {
  const memory = readMemory();
  
  for (const note of memory.notes) {
    const embedding = await generateEmbedding(note.note);
    
    vectorStore.push({
      id: `legacy_${note.ts}`,
      content: note.note,
      embedding,
      metadata: {
        tag: 'legacy',
        timestamp: note.ts
      },
      timestamp: note.ts
    });
  }
}

/**
 * Clear vector store
 */
export function clearVectorStore(): void {
  vectorStore = [];
}

/**
 * Get vector store stats
 */
export function getVectorStoreStats(): {
  totalMemories: number;
  memoryTypes: Record<string, number>;
  averageEmbeddingLength: number;
} {
  const memoryTypes: Record<string, number> = {};
  let totalEmbeddingLength = 0;
  
  for (const memory of vectorStore) {
    const tag = memory.metadata.tag || 'unknown';
    memoryTypes[tag] = (memoryTypes[tag] || 0) + 1;
    totalEmbeddingLength += memory.embedding.length;
  }
  
  return {
    totalMemories: vectorStore.length,
    memoryTypes,
    averageEmbeddingLength: vectorStore.length > 0 ? totalEmbeddingLength / vectorStore.length : 0
  };
}