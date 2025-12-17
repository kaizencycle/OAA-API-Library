#!/usr/bin/env node
/**
 * Initialize agent guard files for development
 * Creates default cooldown and loop guard configs if they don't exist
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Ensure dev directory exists
const devDir = join(rootDir, 'dev');
if (!existsSync(devDir)) {
  mkdirSync(devDir, { recursive: true });
}

// Initialize agent cooldown config
const cooldownPath = join(devDir, 'agent_cooldown.json');
if (!existsSync(cooldownPath)) {
  const defaultCooldown = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    cooldowns: {},
  };
  writeFileSync(cooldownPath, JSON.stringify(defaultCooldown, null, 2));
  console.log('✓ Created default agent_cooldown.json');
}

// Initialize loop guard config
const loopGuardPath = join(devDir, 'loop_guard.json');
if (!existsSync(loopGuardPath)) {
  const defaultLoopGuard = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    maxIterations: 100,
    guards: {},
  };
  writeFileSync(loopGuardPath, JSON.stringify(defaultLoopGuard, null, 2));
  console.log('✓ Created default loop_guard.json');
}

console.log('✓ Agent guards initialized');
