#!/usr/bin/env node
/**
 * PostToolUse Hook - Auto-format files after Edit/Write operations
 *
 * Runs prettier on modified files to maintain consistent formatting.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKIP_EXTENSIONS = new Set([
  '.exe',
  '.dll',
  '.pdb',
  '.so',
  '.dylib',
  '.bin',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.rar',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
]);

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'bin',
  'obj',
  'dist',
  'build',
  'target',
  'vendor',
  '.venv',
  'venv',
  '.astro',
]);

function shouldSkipFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const dirName = path.basename(path.dirname(filePath));
  return SKIP_EXTENSIONS.has(ext) || SKIP_DIRS.has(dirName);
}

function runCommand(cmd, cwd) {
  try {
    execSync(cmd, { cwd: cwd || process.cwd(), stdio: 'pipe', timeout: 10000 });
    return true;
  } catch (error) {
    return false;
  }
}

function formatWithPrettier(filePath, projectRoot) {
  const ext = path.extname(filePath).toLowerCase();

  // Files that prettier should handle
  const prettierExts = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.json',
    '.yaml',
    '.yml',
    '.css',
    '.astro',
    '.md',
    '.mjs',
    '.cjs',
  ];

  if (prettierExts.includes(ext)) {
    runCommand(`npx prettier --write "${filePath}"`, projectRoot);
  }

  return;
}

const fileName = path.basename(filePath);

// Format the file if applicable
formatWithPrettier(filePath, process.cwd());
