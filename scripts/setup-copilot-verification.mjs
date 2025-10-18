#!/usr/bin/env node
/**
 * Setup script for Copilot Verification workflow
 * 
 * This script helps set up the complete copilot verification system including:
 * - Husky pre-commit hooks
 * - Package.json updates
 * - Directory structure creation
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options 
    });
  } catch (error) {
    console.warn(`Command failed: ${cmd}`);
    return '';
  }
}

function updatePackageJson() {
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('⚠️  No package.json found, creating one...');
    const defaultPackage = {
      name: 'copilot-verification-app',
      version: '1.0.0',
      description: 'App with copilot verification',
      scripts: {
        prepare: 'husky install'
      },
      devDependencies: {
        husky: '^9.0.0'
      }
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(defaultPackage, null, 2));
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add prepare script if not exists
  if (!packageJson.scripts) packageJson.scripts = {};
  if (!packageJson.scripts.prepare) {
    packageJson.scripts.prepare = 'husky install';
    console.log('✅ Added prepare script to package.json');
  }

  // Add husky as dev dependency if not exists
  if (!packageJson.devDependencies) packageJson.devDependencies = {};
  if (!packageJson.devDependencies.husky) {
    packageJson.devDependencies.husky = '^9.0.0';
    console.log('✅ Added husky to devDependencies');
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function setupHusky() {
  console.log('🔧 Setting up Husky...');
  
  // Install husky
  console.log('Installing husky...');
  exec('npm install --save-dev husky@9');
  
  // Initialize husky
  console.log('Initializing husky...');
  exec('npx husky install');
  
  // Create pre-commit hook
  const huskyDir = '.husky';
  const preCommitPath = path.join(huskyDir, 'pre-commit');
  
  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true });
  }
  
  const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

node scripts/captureCopilotSuggestions.mjs
git add .copilot/suggestions.json
`;
  
  fs.writeFileSync(preCommitPath, preCommitContent);
  
  // Make it executable
  exec(`chmod +x ${preCommitPath}`);
  
  console.log('✅ Created pre-commit hook');
}

function createDirectories() {
  const dirs = ['.copilot', 'scripts', '.github/workflows'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

function makeScriptsExecutable() {
  const scripts = [
    'scripts/captureCopilotSuggestions.mjs',
    'scripts/verifyCopilotDiff.mjs'
  ];
  
  scripts.forEach(script => {
    if (fs.existsSync(script)) {
      exec(`chmod +x ${script}`);
      console.log(`✅ Made executable: ${script}`);
    }
  });
}

function main() {
  console.log('🚀 Setting up Copilot Verification Workflow');
  console.log('==========================================\n');
  
  try {
    // Create necessary directories
    createDirectories();
    
    // Update package.json
    updatePackageJson();
    
    // Setup Husky
    setupHusky();
    
    // Make scripts executable
    makeScriptsExecutable();
    
    console.log('\n✨ Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update the workflow file to use your actual Core repo path');
    console.log('2. Set up GitHub secrets/variables:');
    console.log('   - LEDGER_BASE_URL (variable)');
    console.log('   - LEDGER_ADMIN_TOKEN (secret)');
    console.log('3. Test the workflow by making a commit');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();