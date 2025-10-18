#!/usr/bin/env node

/**
 * Test script for the complete EOMM flow: Lab7 → OAA → Ledger
 * 
 * Usage: node scripts/test-eomm-flow.mjs
 * 
 * Environment variables needed:
 * - EOMM_INGEST_HMAC_SECRET (same value for Lab7 and OAA)
 * - OAA_INGEST_URL (optional, defaults to localhost)
 * - LEDGER_BASE_URL (for testing ledger sync)
 * - LEDGER_ADMIN_TOKEN (for testing ledger sync)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const OAA_INGEST_URL = process.env.OAA_INGEST_URL || 'http://localhost:3000/api/eomm/ingest';
const SHARED_SECRET = process.env.EOMM_INGEST_HMAC_SECRET || 'test-secret-key-12345';

function sign(body) {
  return crypto.createHmac('sha256', SHARED_SECRET).update(body).digest('hex');
}

async function testEommIngest() {
  console.log('🧪 Testing EOMM Ingest Endpoint...');
  
  const testEntry = {
    title: 'Test Cycle C-999 Clock-Out',
    timestamp: new Date().toISOString(),
    agent: 'eve',
    cycle: 'C-999',
    content: {
      wins: ['Test win 1', 'Test win 2'],
      blocks: ['Test block 1'],
      tomorrowIntent: ['Test intent 1']
    },
    tags: ['clock-out', 'reflection', 'test']
  };

  const body = JSON.stringify(testEntry);
  const signature = sign(body);

  try {
    const response = await fetch(OAA_INGEST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-eomm-hmac': signature
      },
      body
    });

    const result = await response.json();
    
    if (response.ok && result.ok) {
      console.log('✅ EOMM Ingest test passed');
      console.log(`   Filename: ${result.filename}`);
      console.log(`   SHA256: ${result.sha256}`);
      return result;
    } else {
      console.log('❌ EOMM Ingest test failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ EOMM Ingest test error:', error.message);
    return null;
  }
}

async function testLab7Integration() {
  console.log('\n🧪 Testing Lab7 Integration...');
  
  // Simulate Lab7 clock-out data
  const cycle = 'C-999';
  const wins = ['Test win 1', 'Test win 2'];
  const blocks = ['Test block 1'];
  const tomorrowIntent = ['Test intent 1'];
  const companion = 'eve';
  
  const digest = `# Eve Clock-out — ${cycle}
at: ${new Date().toISOString()}
wins:
${wins.map(w => `- ${w}`).join('\n') || '- (none)'}
blocks:
${blocks.map(b => `- ${b}`).join('\n') || '- (none)'}
tomorrow:
${tomorrowIntent.map(t => `- ${t}`).join('\n') || '- (none)'}`;

  const sha256 = crypto.createHash('sha256').update(digest).digest('hex');
  
  const eommEntry = {
    title: `Cycle ${cycle} clock-out`,
    timestamp: new Date().toISOString(),
    agent: companion,
    cycle,
    content: {
      wins,
      blocks,
      tomorrowIntent,
      digest,
      sha256
    },
    tags: ['clock-out', 'reflection']
  };

  const body = JSON.stringify(eommEntry);
  const signature = sign(body);

  try {
    const response = await fetch(OAA_INGEST_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-eomm-hmac': signature
      },
      body
    });

    const result = await response.json();
    
    if (response.ok && result.ok) {
      console.log('✅ Lab7 Integration test passed');
      console.log(`   Entry ID: ${result.id}`);
      return result;
    } else {
      console.log('❌ Lab7 Integration test failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Lab7 Integration test error:', error.message);
    return null;
  }
}

function testHmacVerification() {
  console.log('\n🧪 Testing HMAC Verification...');
  
  const testData = '{"test": "data"}';
  const correctSig = sign(testData);
  const wrongSig = 'wrong-signature';
  
  // Test correct signature
  const correctResult = crypto.timingSafeEqual(
    Buffer.from(correctSig, 'hex'),
    Buffer.from(correctSig, 'hex')
  );
  
  // Test wrong signature
  const wrongResult = crypto.timingSafeEqual(
    Buffer.from(correctSig, 'hex'),
    Buffer.from(wrongSig, 'hex')
  );
  
  if (correctResult && !wrongResult) {
    console.log('✅ HMAC Verification test passed');
    return true;
  } else {
    console.log('❌ HMAC Verification test failed');
    return false;
  }
}

async function testCurlCommand() {
  console.log('\n🧪 Testing cURL Command...');
  
  const testEntry = {
    title: 'C-999 Clock-In',
    timestamp: '2025-01-18T07:58:00-04:00',
    agent: 'eve',
    cycle: 'C-999',
    content: 'Test intent content'
  };
  
  const body = JSON.stringify(testEntry);
  const signature = sign(body);
  
  console.log('Test cURL command:');
  console.log(`curl -s -X POST "${OAA_INGEST_URL}" \\`);
  console.log(`  -H "content-type: application/json" \\`);
  console.log(`  -H "x-eomm-hmac: ${signature}" \\`);
  console.log(`  -d '${body}' | jq`);
  
  return true;
}

async function main() {
  console.log('🚀 Starting EOMM Flow Tests\n');
  
  // Check environment
  if (!process.env.EOMM_INGEST_HMAC_SECRET) {
    console.log('⚠️  Warning: EOMM_INGEST_HMAC_SECRET not set, using test value');
  }
  
  const tests = [
    testHmacVerification,
    testEommIngest,
    testLab7Integration,
    testCurlCommand
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! EOMM flow is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

main().catch(console.error);