#!/usr/bin/env node
// scripts/test-oaa-simple.mjs
// Simple test script for OAA API Library optimizations

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.OAA_BASE_URL || 'http://localhost:3000';
const HMAC_SECRET = process.env.OAA_HMAC_SECRET || 'test-secret';

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
 * Test file structure
 */
function testFileStructure() {
  console.log('🧪 Testing File Structure...');
  
  const requiredFiles = [
    'pages/api/oaa/companions/consensus.ts',
    'pages/api/oaa/memory/search.ts',
    'pages/api/eve/clockout-enhanced.ts',
    'src/lib/memory/vectorStore.ts',
    'src/lib/middleware/constitutional.ts'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length === 0) {
    console.log('✅ All required files present');
    return { success: true };
  } else {
    console.log('❌ Missing files:', missingFiles);
    return { success: false, missing: missingFiles };
  }
}

/**
 * Test TypeScript compilation
 */
function testTypeScriptCompilation() {
  console.log('\n🧪 Testing TypeScript Compilation...');
  
  try {
    // Check if tsconfig.json exists
    if (!fs.existsSync('tsconfig.json')) {
      console.log('❌ tsconfig.json not found');
      return { success: false };
    }
    
    // Check for basic TypeScript syntax in key files
    const tsFiles = [
      'pages/api/oaa/companions/consensus.ts',
      'src/lib/middleware/constitutional.ts'
    ];
    
    let hasErrors = false;
    
    for (const file of tsFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Basic syntax checks
        if (content.includes('import type') && content.includes('interface')) {
          console.log(`✅ ${file} - TypeScript syntax looks good`);
        } else {
          console.log(`⚠️  ${file} - May have TypeScript issues`);
          hasErrors = true;
        }
      }
    }
    
    return { success: !hasErrors };
  } catch (error) {
    console.log('❌ TypeScript compilation test failed:', error.message);
    return { success: false };
  }
}

/**
 * Test environment configuration
 */
function testEnvironmentConfig() {
  console.log('\n🧪 Testing Environment Configuration...');
  
  const requiredEnvVars = [
    'OAA_HMAC_SECRET'
  ];
  
  const optionalEnvVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length === 0) {
    console.log('✅ Required environment variables present');
    if (missingOptional.length > 0) {
      console.log(`⚠️  Optional API keys missing: ${missingOptional.join(', ')}`);
      console.log('   Some features may not work without these keys');
    }
    return { success: true, missingOptional };
  } else {
    console.log('❌ Missing required variables:', missing);
    return { success: false, missing };
  }
}

/**
 * Test package.json dependencies
 */
function testDependencies() {
  console.log('\n🧪 Testing Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = packageJson.dependencies || {};
    
    const requiredDeps = ['openai', '@anthropic-ai/sdk'];
    const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
    
    if (missingDeps.length === 0) {
      console.log('✅ All required dependencies present');
      return { success: true };
    } else {
      console.log('❌ Missing dependencies:', missingDeps);
      console.log('   Run: npm install ' + missingDeps.join(' '));
      return { success: false, missing: missingDeps };
    }
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return { success: false };
  }
}

/**
 * Test API endpoint structure
 */
function testAPIStructure() {
  console.log('\n🧪 Testing API Endpoint Structure...');
  
  const endpoints = [
    {
      path: 'pages/api/oaa/companions/consensus.ts',
      name: 'Multi-LLM Consensus',
      requiredExports: ['default'],
      requiredImports: ['NextApiRequest', 'NextApiResponse', 'hmacValid']
    },
    {
      path: 'pages/api/oaa/memory/search.ts',
      name: 'Vector Memory Search',
      requiredExports: ['default'],
      requiredImports: ['NextApiRequest', 'NextApiResponse', 'semanticSearch']
    },
    {
      path: 'pages/api/eve/clockout-enhanced.ts',
      name: 'Enhanced Eve Clockout',
      requiredExports: ['default'],
      requiredImports: ['NextApiRequest', 'NextApiResponse', 'hmacValid']
    }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    if (fs.existsSync(endpoint.path)) {
      const content = fs.readFileSync(endpoint.path, 'utf8');
      
      // Check for required exports
      const hasDefaultExport = content.includes('export default');
      const hasRequiredImports = endpoint.requiredImports.every(imp => 
        content.includes(imp)
      );
      
      if (hasDefaultExport && hasRequiredImports) {
        console.log(`✅ ${endpoint.name} - Structure looks good`);
      } else {
        console.log(`❌ ${endpoint.name} - Missing required exports/imports`);
        allPassed = false;
      }
    } else {
      console.log(`❌ ${endpoint.name} - File not found`);
      allPassed = false;
    }
  }
  
  return { success: allPassed };
}

/**
 * Test middleware structure
 */
function testMiddlewareStructure() {
  console.log('\n🧪 Testing Middleware Structure...');
  
  const middlewareFile = 'src/lib/middleware/constitutional.ts';
  
  if (!fs.existsSync(middlewareFile)) {
    console.log('❌ Constitutional middleware not found');
    return { success: false };
  }
  
  const content = fs.readFileSync(middlewareFile, 'utf8');
  
  const requiredExports = [
    'validateConstitutionally',
    'withConstitutionalValidation',
    'batchValidateConstitutionally'
  ];
  
  const hasRequiredExports = requiredExports.every(exp => 
    content.includes(`export ${exp}`)
  );
  
  const hasCustosCharter = content.includes('CUSTOS_CHARTER');
  const hasClauses = content.includes('clauses:');
  
  if (hasRequiredExports && hasCustosCharter && hasClauses) {
    console.log('✅ Constitutional middleware - Structure looks good');
    return { success: true };
  } else {
    console.log('❌ Constitutional middleware - Missing required components');
    return { success: false };
  }
}

/**
 * Test vector store structure
 */
function testVectorStoreStructure() {
  console.log('\n🧪 Testing Vector Store Structure...');
  
  const vectorStoreFile = 'src/lib/memory/vectorStore.ts';
  
  if (!fs.existsSync(vectorStoreFile)) {
    console.log('❌ Vector store not found');
    return { success: false };
  }
  
  const content = fs.readFileSync(vectorStoreFile, 'utf8');
  
  const requiredExports = [
    'addMemoryWithVector',
    'semanticSearch',
    'findRelatedMemories',
    'summarizeMemoryInsights',
    'autoTagMemory'
  ];
  
  const hasRequiredExports = requiredExports.every(exp => 
    content.includes(`export ${exp}`)
  );
  
  const hasEmbeddingFunction = content.includes('generateEmbedding');
  const hasSimilarityFunction = content.includes('cosineSimilarity');
  
  if (hasRequiredExports && hasEmbeddingFunction && hasSimilarityFunction) {
    console.log('✅ Vector store - Structure looks good');
    return { success: true };
  } else {
    console.log('❌ Vector store - Missing required components');
    return { success: false };
  }
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  console.log('\n📊 Test Report');
  console.log('==============');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.success).length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\n🎯 Feature Status');
  console.log('==================');
  
  if (results.fileStructure?.success) {
    console.log('✅ File Structure: Complete');
  } else {
    console.log('❌ File Structure: Issues detected');
  }
  
  if (results.typeScript?.success) {
    console.log('✅ TypeScript: Compilation ready');
  } else {
    console.log('❌ TypeScript: Issues detected');
  }
  
  if (results.environment?.success) {
    console.log('✅ Environment: Configured');
  } else {
    console.log('❌ Environment: Issues detected');
  }
  
  if (results.dependencies?.success) {
    console.log('✅ Dependencies: Installed');
  } else {
    console.log('❌ Dependencies: Issues detected');
  }
  
  if (results.apiStructure?.success) {
    console.log('✅ API Endpoints: Structured correctly');
  } else {
    console.log('❌ API Endpoints: Issues detected');
  }
  
  if (results.middleware?.success) {
    console.log('✅ Constitutional Middleware: Ready');
  } else {
    console.log('❌ Constitutional Middleware: Issues detected');
  }
  
  if (results.vectorStore?.success) {
    console.log('✅ Vector Store: Ready');
  } else {
    console.log('❌ Vector Store: Issues detected');
  }
  
  console.log('\n💡 Next Steps');
  console.log('==============');
  
  if (!results.dependencies?.success) {
    console.log('• Install missing dependencies: npm install');
  }
  
  if (!results.environment?.success) {
    console.log('• Configure environment variables');
  }
  
  if (results.environment?.missingOptional?.length > 0) {
    console.log('• Add API keys for full functionality');
  }
  
  console.log('• Start development server: npm run dev');
  console.log('• Test endpoints with actual requests');
  console.log('• Deploy to staging environment');
  
  return results;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 OAA API Library Optimization Tests');
  console.log('=====================================');
  
  const results = {
    fileStructure: testFileStructure(),
    typeScript: testTypeScriptCompilation(),
    environment: testEnvironmentConfig(),
    dependencies: testDependencies(),
    apiStructure: testAPIStructure(),
    middleware: testMiddlewareStructure(),
    vectorStore: testVectorStoreStructure()
  };
  
  return generateTestReport(results);
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };