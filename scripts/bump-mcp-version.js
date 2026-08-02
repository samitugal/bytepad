#!/usr/bin/env node
/**
 * Bumps the docker/mcp-server subproject version - independent from the app
 * version, see docs/VERSION_LOCATIONS.md for why. Source of truth:
 * docker/mcp-server/package.json's `version` field.
 *
 * Locations are kept in sync with scripts/check-version.js - if you add a
 * location there, add the matching rewrite here too, and vice versa.
 *
 * docker/mcp-server/package-lock.json is deliberately left alone (same
 * reasoning as the root lockfile in check-version.js). Run
 * `cd docker/mcp-server && npm install --package-lock-only` afterwards.
 *
 * Usage: node scripts/bump-mcp-version.js <new-version>
 *   e.g. node scripts/bump-mcp-version.js 0.26.0
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const path = (relPath) => join(ROOT, relPath);
const read = (relPath) => readFileSync(path(relPath), 'utf8');
const write = (relPath, content) => writeFileSync(path(relPath), content);

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Usage: node scripts/bump-mcp-version.js <new-version>  (e.g. 0.26.0)');
  process.exit(1);
}

function replaceOne(relPath, regex, replacement, describe) {
  const before = read(relPath);
  if (!regex.test(before)) {
    console.warn(`  ! ${relPath} (${describe}): pattern not found, left unchanged - check the file manually.`);
    return;
  }
  const after = before.replace(regex, replacement);
  write(relPath, after);
  console.log(`  - ${relPath} (${describe})`);
}

console.log(`Bumping docker/mcp-server version -> ${newVersion}\n`);

const pkg = JSON.parse(read('docker/mcp-server/package.json'));
pkg.version = newVersion;
write('docker/mcp-server/package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(`  - docker/mcp-server/package.json (source)`);

replaceOne('docker/mcp-server/Dockerfile', /LABEL version="[\d.]+"/, `LABEL version="${newVersion}"`, 'Dockerfile LABEL');
replaceOne('docker/mcp-server/src/routes.ts', /version: '[\d.]+'/, `version: '${newVersion}'`, 'health route response');
replaceOne('docker/mcp-server/src/server.ts', /name: 'bytepad', version: '[\d.]+'/, `name: 'bytepad', version: '${newVersion}'`, 'MCP server info');
replaceOne('docker/mcp-server/src/server.ts', /npm_package_version \|\| '[\d.]+'/, `npm_package_version || '${newVersion}'`, 'health endpoint fallback');
replaceOne('docker-compose.yml', /image: bytepad\/mcp-server:[\d.]+/, `image: bytepad/mcp-server:${newVersion}`, 'docker-compose image tag');
replaceOne('README.md', /image: bytepad\/mcp-server:[\d.]+/, `image: bytepad/mcp-server:${newVersion}`, 'docker-compose usage snippet');
replaceOne('electron/services/dockerService.ts', /const IMAGE_TAG = '[\d.]+'/, `const IMAGE_TAG = '${newVersion}'`, 'Electron docker image tag');

console.log(`\nDone. Now:`);
console.log(`  1. cd docker/mcp-server && npm install --package-lock-only && cd ../..`);
console.log(`  2. node scripts/check-version.js   (should be clean)`);
console.log(`  3. If you're publishing a new image, tag and push bytepad/mcp-server:${newVersion}`);
