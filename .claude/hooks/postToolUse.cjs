#!/usr/bin/env node
/**
 * PostToolUse Hook - Mirrors lint-staged config from package.json
 *
 * Dynamically reads lint-staged config and runs matching commands
 * on files modified by Edit/Write tool calls.
 *
 * Uses micromatch (transitive dep of lint-staged) for glob matching.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.astro']);

function shouldSkipFile(filePath) {
  return filePath.split(path.sep).some(seg => SKIP_DIRS.has(seg));
}

function loadLintStagedConfig(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg['lint-staged'] || null;
}

// --- Main ---
let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf-8').trim());
} catch (e) {
  process.stderr.write(`postToolUse hook: failed to parse stdin: ${e.message}\n`);
  process.exit(0);
}

const filePath = data.tool_input?.file_path;
if (!filePath) process.exit(0);
if (!fs.existsSync(filePath)) process.exit(0);
if (shouldSkipFile(filePath)) process.exit(0);

const cwd = data.cwd || process.cwd();
const config = loadLintStagedConfig(cwd);
if (!config) process.exit(0);

let micromatch;
try {
  micromatch = require('micromatch');
} catch (e) {
  process.stderr.write(`postToolUse hook: micromatch not available: ${e.message}\n`);
  process.exit(0);
}

// Match file's relative path against lint-staged glob patterns (mirrors lint-staged behavior)
const relPath = path.relative(cwd, filePath);
const binDir = path.join(cwd, 'node_modules', '.bin');
const pathEnv = `${binDir}${path.delimiter}${process.env.PATH}`;
const failures = [];

for (const [pattern, commands] of Object.entries(config)) {
  if (!micromatch.isMatch(relPath, pattern, { basename: true })) continue;

  const cmds = Array.isArray(commands) ? commands : [commands];
  for (const cmd of cmds) {
    try {
      execSync(`${cmd} "${filePath}"`, {
        cwd,
        stdio: 'pipe',
        timeout: 15000,
        env: { ...process.env, PATH: pathEnv },
      });
    } catch (e) {
      const output = e.stdout?.toString().trim();
      const errors = e.stderr?.toString().trim();
      const detail = output || errors || e.message;
      failures.push(`\`${cmd}\` failed on ${path.basename(filePath)}:\n${detail}`);
    }
  }
}

if (failures.length > 0) {
  const result = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: failures.join('\n\n'),
    },
  };
  process.stdout.write(JSON.stringify(result) + '\n');
}
