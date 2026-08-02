#!/usr/bin/env node
/**
 * Bumps the app version (NOT docker/mcp-server - see bump-mcp-version.js
 * for that independent stream) to a new value everywhere it's duplicated.
 *
 * Source of truth: package.json's `version` field. This script sets it,
 * then rewrites every other tracked location to match. Locations are kept
 * in sync with scripts/check-version.js - if you add a location there, add
 * the matching rewrite here too, and vice versa.
 *
 * package-lock.json is deliberately left alone - see the note in
 * check-version.js. Run `npm install --package-lock-only` afterwards.
 *
 * Usage: node scripts/bump-version.js <new-version>
 *   e.g. node scripts/bump-version.js 0.26.0
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
  console.error('Usage: node scripts/bump-version.js <new-version>  (e.g. 0.26.0)');
  process.exit(1);
}
const newSeries = `${newVersion.split('.').slice(0, 2).join('.')}.x`;

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

console.log(`Bumping app version -> ${newVersion}\n`);

// package.json (the source itself)
const pkg = JSON.parse(read('package.json'));
pkg.version = newVersion;
write('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(`  - package.json (source)`);

replaceOne('README.md', /badge\/version-[\w.]+-green/, `badge/version-${newVersion}-green`, 'version badge');
replaceOne('public/sw.js', /const APP_VERSION = '[\d.]+'/, `const APP_VERSION = '${newVersion}'`, 'service worker cache-busting version');
replaceOne('docs/VERSION_LOCATIONS.md', /Son güncelleme: v[\d.]+/, `Son güncelleme: v${newVersion}`, 'doc footer');
replaceOne('SECURITY.md', /\| [\d.]+\.x \(latest\) \|/, `| ${newSeries} (latest) |`, 'supported versions table');

// StatusBar.tsx / SettingsPanel.tsx render this live (src/utils/appVersion.ts)
// and public/sw.js aside, there is nothing else to touch for the app stream -
// src/services/updateService.ts and electron/server/mcp/index.ts read the
// running version at runtime, not a literal, so a version bump alone can't
// leave them stale.

console.log(`\nDone. Now:`);
console.log(`  1. npm install --package-lock-only`);
console.log(`  2. node scripts/check-version.js   (should be clean)`);
console.log(`  3. Add a CHANGELOG.md entry for ${newVersion}`);
console.log(`  4. If docker/mcp-server needs a bump too, that's separate: scripts/bump-mcp-version.js`);
