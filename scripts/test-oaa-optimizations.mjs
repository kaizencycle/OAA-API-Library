#!/usr/bin/env node
// scripts/test-oaa-optimizations.mjs
// Test script for OAA API Library optimizations

import crypto from 'crypto';

const BASE_URL = process.env.OAA_BASE_URL || 'http://localhost:3000';
const HMAC_SECRET = process.env.OAA_HMAC_SECRET || 'test-secret';

// Test configuration
const TESTS = {
  multiLLMConsensus: {
    name: 'Multi-LLM Consensus',
    endpoint: '/api/oaa/companions/consensus',
    method: 'POST',
    body: {
      prompt: 'Draft a civic engagement strategy for the OAA platform',
      operationTier: 'standard',
      companions: ['AUREA', 'ATLAS', 'SOLARA']
    }
  },
  vectorMemorySearch: {
    name: 'Vector Memory Search',
    endpoint: '/api/oaa/memory/search',
    method: 'POST',
    body: {
      query: 'civic engagement strategy',
      limit: 5,
      generateInsights: true,
      focusArea: 'governance'
    }
  },
  enhancedEveClockout: {
    name: 'Enhanced Eve Clockout',
    endpoint: '/api/eve/clockout-enhanced',
    method: 'POST',
    body: {
      cycle: 'C-114',
      companion: 'eve',
      wins: [
        'Implemented multi-LLM consensus system',
        'Added vector memory search capabilities',
        'Created constitutional middleware'
      ],
      blocks: [
        'API key configuration needed',
        'Testing integration points'
      ],
      tomorrowIntent: [
        'Deploy to production',
        'Monitor system performance',
        'Gather user feedback'
      ],
      meta: {
        tz: 'UTC',
        duration_hours: 8
      }
    }
  }
};

/**
 * Generate HMAC signature
 */
function generateHMAC(body, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

/**
 * Run a single test
 */
async function runTest(testName, testConfig) {
  console.log(`\n🧪 Testing ${testName}...`);
  
  try {
    const signature = generateHMAC(testConfig.body, HMAC_SECRET);
    
    const response = await fetch(`${BASE_URL}${testConfig.endpoint}`, {
      method: testConfig.method,
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-sha256': signature
      },
      body: JSON.stringify(testConfig.body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${testName} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      
      // Check for specific response features
      if (testName === 'Multi-LLM Consensus') {
        if (data.votes && data.consensus) {
          console.log(`   Votes received: ${Object.keys(data.votes).length}`);
          console.log(`   Consensus approved: ${data.approved}`);
        }
      } else if (testName === 'Vector Memory Search') {
        if (data.results) {
          console.log(`   Search results: ${data.results.length}`);
          if (data.insights) {
            console.log(`   AI insights generated: Yes`);
          }
        }
      } else if (testName === 'Enhanced Eve Clockout') {
        if (data.aiInsights) {
          console.log(`   AI insights: ${data.aiInsights.patternAnalysis ? 'Yes' : 'No'}`);
          console.log(`   Momentum score: ${data.aiInsights.momentumScore}`);
        }
      }
      
      return { success: true, data };
    } else {
      console.log(`❌ ${testName} - FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`❌ ${testName} - ERROR`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test constitutional middleware
 */
async function testConstitutionalMiddleware() {
  console.log(`\n🧪 Testing Constitutional Middleware...`);
  
  try {
    // Test with constitutional content
    const constitutionalContent = {
      prompt: 'Create a transparent, equitable civic engagement platform that respects human dignity and promotes community benefit'
    };
    
    const signature = generateHMAC(constitutionalContent, HMAC_SECRET);
    
    const response = await fetch(`${BASE_URL}/api/oaa/companions/consensus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hmac-sha256': signature
      },
      body: JSON.stringify(constitutionalContent)
    });
    
    const constitutionalScore = response.headers.get('x-constitutional-score');
    
    if (constitutionalScore) {
      console.log(`✅ Constitutional Middleware - SUCCESS`);
      console.log(`   Constitutional Score: ${constitutionalScore}`);
      return { success: true, score: parseInt(constitutionalScore) };
    } else {
      console.log(`⚠️  Constitutional Middleware - No score header found`);
      return { success: false, error: 'No constitutional score header' };
    }
  } catch (error) {
    console.log(`❌ Constitutional Middleware - ERROR`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test environment configuration
 */
function testEnvironmentConfig() {
  console.log(`\n🔧 Testing Environment Configuration...`);
  
  const requiredEnvVars = [
    'OAA_HMAC_SECRET',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length === 0) {
    console.log(`✅ Environment Configuration - All required variables present`);
    return { success: true };
  } else {
    console.log(`⚠️  Environment Configuration - Missing variables: ${missing.join(', ')}`);
    console.log(`   Note: Some features may not work without these API keys`);
    return { success: false, missing };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 OAA API Library Optimization Tests');
  console.log('=====================================');
  
  const results = {
    environment: testEnvironmentConfig(),
    tests: {},
    constitutional: null
  };
  
  // Run individual tests
  for (const [testKey, testConfig] of Object.entries(TESTS)) {
    results.tests[testKey] = await runTest(testConfig.name, testConfig);
  }
  
  // Test constitutional middleware
  results.constitutional = await testConstitutionalMiddleware();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const totalTests = Object.keys(TESTS).length + 2; // +2 for environment and constitutional
  const passedTests = Object.values(results.tests).filter(r => r.success).length + 
                     (results.environment.success ? 1 : 0) + 
                     (results.constitutional?.success ? 1 : 0);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  // Feature-specific results
  console.log('\n🎯 Feature Status');
  console.log('==================');
  
  if (results.tests.multiLLMConsensus?.success) {
    console.log('✅ Multi-LLM Consensus: Ready');
  } else {
    console.log('❌ Multi-LLM Consensus: Issues detected');
  }
  
  if (results.tests.vectorMemorySearch?.success) {
    console.log('✅ Vector Memory Search: Ready');
  } else {
    console.log('❌ Vector Memory Search: Issues detected');
  }
  
  if (results.tests.enhancedEveClockout?.success) {
    console.log('✅ Enhanced Eve Clockout: Ready');
  } else {
    console.log('❌ Enhanced Eve Clockout: Issues detected');
  }
  
  if (results.constitutional?.success) {
    console.log('✅ Constitutional Middleware: Ready');
  } else {
    console.log('❌ Constitutional Middleware: Issues detected');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations');
  console.log('==================');
  
  if (!results.environment.success) {
    console.log('• Configure missing environment variables for full functionality');
  }
  
  if (results.constitutional?.score && results.constitutional.score < 80) {
    console.log('• Improve constitutional compliance in test content');
  }
  
  console.log('• Review API responses for any warnings or errors');
  console.log('• Test with real data in production environment');
  console.log('• Monitor performance and adjust rate limits as needed');
  
  return results;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, runTest, testConstitutionalMiddleware };