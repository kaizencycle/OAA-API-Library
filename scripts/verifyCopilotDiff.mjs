#!/usr/bin/env node
/**
 * Copilot Diff Verifier
 * 
 * Compares AI-generated suggestions against actual code changes to compute
 * an overlap score and optionally seal the proof to a Civic Ledger.
 * 
 * Environment Variables:
 * - BASE_REF: Git ref to compare against (default: HEAD~1)
 * - HEAD_REF: Git ref to compare from (default: HEAD)
 * - MIN_SCORE: Minimum overlap score threshold (default: 0.35)
 * - MIN_SCORE_FAIL: Whether to fail if below min_score (default: false)
 * - LEDGER_BASE_URL: Civic Ledger API base URL
 * - LEDGER_ADMIN_TOKEN: Bearer token for ledger operations
 * - PROOF_OUT: Output file for proof JSON (default: .copilot/proof.json)
 */

import fs from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';

// Configuration from environment
const BASE_REF = process.env.BASE_REF || 'HEAD~1';
const HEAD_REF = process.env.HEAD_REF || 'HEAD';
const MIN_SCORE = parseFloat(process.env.MIN_SCORE || '0.35');
const MIN_SCORE_FAIL = process.env.MIN_SCORE_FAIL === 'true';
const LEDGER_BASE_URL = process.env.LEDGER_BASE_URL;
const LEDGER_ADMIN_TOKEN = process.env.LEDGER_ADMIN_TOKEN;
const PROOF_OUT = process.env.PROOF_OUT || '.copilot/proof.json';

// Utility functions
function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { 
      encoding: 'utf8', 
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options 
    });
  } catch (error) {
    console.warn(`Command failed: ${cmd}`);
    return '';
  }
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function computeOverlap(suggestions, actualDiff) {
  if (!suggestions.length || !actualDiff.trim()) {
    return { score: 0, matches: [], details: 'No suggestions or diff to compare' };
  }

  const normalizedDiff = normalizeText(actualDiff);
  const matches = [];
  let totalOverlap = 0;
  let totalSuggestions = 0;

  for (const suggestion of suggestions) {
    if (!suggestion.text || !suggestion.text.trim()) continue;
    
    const normalizedSuggestion = normalizeText(suggestion.text);
    if (!normalizedSuggestion) continue;

    totalSuggestions++;
    
    // Simple word-based overlap calculation
    const suggestionWords = normalizedSuggestion.split(' ');
    const diffWords = normalizedDiff.split(' ');
    
    let overlap = 0;
    const matchedWords = [];
    
    for (const word of suggestionWords) {
      if (word.length < 3) continue; // Skip very short words
      if (diffWords.includes(word)) {
        overlap++;
        matchedWords.push(word);
      }
    }
    
    const suggestionScore = suggestionWords.length > 0 ? overlap / suggestionWords.length : 0;
    totalOverlap += suggestionScore;
    
    matches.push({
      file: suggestion.file || 'unknown',
      score: suggestionScore,
      matchedWords: matchedWords.slice(0, 10), // Limit for readability
      suggestionPreview: suggestion.text.substring(0, 100) + (suggestion.text.length > 100 ? '...' : '')
    });
  }

  const overallScore = totalSuggestions > 0 ? totalOverlap / totalSuggestions : 0;
  
  return {
    score: Math.round(overallScore * 1000) / 1000, // Round to 3 decimal places
    matches: matches.filter(m => m.score > 0.1), // Only include meaningful matches
    details: `Compared ${totalSuggestions} suggestions against diff`
  };
}

async function sealToLedger(proof) {
  if (!LEDGER_BASE_URL || !LEDGER_ADMIN_TOKEN) {
    console.log('Skipping ledger sealing: credentials not provided');
    return null;
  }

  try {
    const response = await fetch(`${LEDGER_BASE_URL}/seal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEDGER_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'copilot-verification',
        data: proof,
        metadata: {
          timestamp: new Date().toISOString(),
          repository: process.env.GITHUB_REPOSITORY || 'unknown',
          workflow: process.env.GITHUB_WORKFLOW || 'unknown'
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`Proof sealed to ledger: ${result.id || 'unknown'}`);
      return result;
    } else {
      console.warn(`Failed to seal to ledger: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.warn(`Error sealing to ledger: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Copilot Diff Verifier');
  console.log(`Comparing ${BASE_REF} → ${HEAD_REF}`);
  console.log(`Minimum score threshold: ${MIN_SCORE}`);

  // Load suggestions
  let suggestions = [];
  try {
    const suggestionsPath = '.copilot/suggestions.json';
    if (fs.existsSync(suggestionsPath)) {
      const data = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
      suggestions = data.suggestions || [];
      console.log(`📋 Loaded ${suggestions.length} suggestions`);
    } else {
      console.log('⚠️  No suggestions file found, using empty set');
    }
  } catch (error) {
    console.warn(`Error loading suggestions: ${error.message}`);
  }

  // Get actual diff
  const actualDiff = exec(`git diff ${BASE_REF} ${HEAD_REF} --unified=0 --no-color`);
  if (!actualDiff.trim()) {
    console.log('ℹ️  No changes detected in the specified range');
  }

  // Compute overlap
  const overlap = computeOverlap(suggestions, actualDiff);
  console.log(`📊 Overlap score: ${overlap.score}`);
  console.log(`📝 ${overlap.details}`);

  if (overlap.matches.length > 0) {
    console.log('\n🎯 Top matches:');
    overlap.matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .forEach((match, i) => {
        console.log(`  ${i + 1}. ${match.file} (${(match.score * 100).toFixed(1)}%)`);
        console.log(`     Words: ${match.matchedWords.join(', ')}`);
        console.log(`     Preview: ${match.suggestionPreview}`);
      });
  }

  // Create proof
  const proof = {
    timestamp: new Date().toISOString(),
    baseRef: BASE_REF,
    headRef: HEAD_REF,
    diffHash: sha256(actualDiff),
    suggestionsCount: suggestions.length,
    overlap: overlap,
    decision: overlap.score >= MIN_SCORE ? 'conforms' : 'diverges',
    threshold: MIN_SCORE,
    repository: process.env.GITHUB_REPOSITORY || 'unknown',
    commit: process.env.GITHUB_SHA || HEAD_REF,
    workflow: process.env.GITHUB_WORKFLOW || 'unknown',
    runId: process.env.GITHUB_RUN_ID || 'unknown'
  };

  // Seal to ledger if configured
  const ledgerResult = await sealToLedger(proof);
  if (ledgerResult) {
    proof.ledgerId = ledgerResult.id;
    proof.ledgerUrl = ledgerResult.url;
  }

  // Write proof file
  fs.mkdirSync('.copilot', { recursive: true });
  fs.writeFileSync(PROOF_OUT, JSON.stringify(proof, null, 2));
  console.log(`💾 Proof written to ${PROOF_OUT}`);

  // Determine outcome
  const passed = overlap.score >= MIN_SCORE;
  console.log(`\n${passed ? '✅' : '❌'} Verification ${passed ? 'PASSED' : 'FAILED'}`);
  console.log(`Score: ${overlap.score} (threshold: ${MIN_SCORE})`);

  if (!passed && MIN_SCORE_FAIL) {
    console.log('🚫 Failing workflow due to low score');
    process.exit(1);
  }

  console.log('✨ Verification complete');
}

// Run the main function
main().catch(error => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});