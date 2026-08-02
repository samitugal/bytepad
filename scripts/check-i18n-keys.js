#!/usr/bin/env node
/**
 * i18n key consistency checker.
 *
 * Cross-references src/i18n/en.json / tr.json against every t('...') call
 * site under src/, and reports four things:
 *
 *   1. defined-but-unreferenced keys  (en.json has it, nothing calls it)
 *   2. referenced-but-undefined keys  (t() calls a key en.json doesn't have)
 *   3. keys in en.json missing from tr.json
 *   4. keys in tr.json missing from en.json
 *
 * Category 2 is the dangerous direction: src/i18n/index.ts's getNestedValue()
 * falls back to returning the raw key path (e.g. "settings.foo.bar") when a
 * key isn't found, and that fallback is truthy - so `t('x') || 'default'`
 * patterns never engage their fallback either. A miss here is a live string
 * on screen, not a hygiene nit.
 *
 * Dynamic key construction: t() is sometimes called as a template literal
 * with an interpolated suffix, e.g. t(`tasks.${filter}`). This script cannot
 * know the runtime value of `filter`, so it does NOT guess. Any such call is
 * reported separately as "unresolved (dynamic)" and, conservatively, every
 * defined key under that same prefix is excluded from the "unused" list too
 * (we can't prove those keys ARE used, but we equally can't prove they
 * AREN'T - and a checker that cries wolf on things it can't actually verify
 * gets ignored). A call is only ever treated as literal/resolvable when the
 * key is a plain string with no interpolation.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC_DIR = join(ROOT, 'src')
const EN_PATH = join(ROOT, 'src/i18n/en.json')
const TR_PATH = join(ROOT, 'src/i18n/tr.json')
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-electron', 'out'])

function flatten(obj, prefix = '', into = new Set()) {
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, into)
    } else {
      into.add(path)
    }
  }
  return into
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(join(dir, entry.name), files)
    } else {
      const dot = entry.name.lastIndexOf('.')
      if (dot !== -1 && SCAN_EXTENSIONS.has(entry.name.slice(dot))) {
        files.push(join(dir, entry.name))
      }
    }
  }
  return files
}

// Matches t('literal'), t("literal") and t(`literal`) call sites, capturing
// the quote char and the raw string content (including any ${...} so the
// caller can decide whether it's a genuine template interpolation).
const CALL_RE = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g

function scanFiles(files) {
  const literalUses = new Map() // key -> Set of "file:line"
  const dynamicUses = [] // { prefix, location }

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    const relPath = relative(ROOT, file)
    let match
    CALL_RE.lastIndex = 0
    while ((match = CALL_RE.exec(content)) !== null) {
      const [, quote, raw] = match
      const line = content.slice(0, match.index).split('\n').length
      const location = `${relPath}:${line}`

      if (quote === '`' && raw.includes('${')) {
        // Dynamic: only the text before the first interpolation is known.
        const prefix = raw.slice(0, raw.indexOf('${'))
        dynamicUses.push({ prefix, location, raw })
        continue
      }

      if (!literalUses.has(raw)) literalUses.set(raw, new Set())
      literalUses.get(raw).add(location)
    }
  }

  return { literalUses, dynamicUses }
}

function main() {
  const en = JSON.parse(readFileSync(EN_PATH, 'utf8'))
  const tr = JSON.parse(readFileSync(TR_PATH, 'utf8'))
  const enKeys = flatten(en)
  const trKeys = flatten(tr)

  const files = walk(SRC_DIR)
  const { literalUses, dynamicUses } = scanFiles(files)

  // Keys covered (or plausibly covered) by a dynamic prefix are excluded
  // from "unused" reporting - see module docstring.
  const dynamicPrefixes = [...new Set(dynamicUses.map((d) => d.prefix).filter(Boolean))]
  const isDynamicallyCovered = (key) => dynamicPrefixes.some((p) => key.startsWith(p))

  const undefinedKeys = [...literalUses.keys()]
    .filter((key) => !enKeys.has(key))
    .sort()
    .map((key) => ({ key, locations: [...literalUses.get(key)].sort() }))

  const unusedKeys = [...enKeys]
    .filter((key) => !literalUses.has(key) && !isDynamicallyCovered(key))
    .sort()

  const enMissingInTr = [...enKeys].filter((k) => !trKeys.has(k)).sort()
  const trMissingInEn = [...trKeys].filter((k) => !enKeys.has(k)).sort()

  const unresolved = dynamicUses
    .slice()
    .sort((a, b) => a.location.localeCompare(b.location))

  // ---- report ----
  const line = '-'.repeat(60)
  console.log(line)
  console.log('i18n key consistency check')
  console.log(line)
  console.log(`en.json keys: ${enKeys.size}    tr.json keys: ${trKeys.size}`)
  console.log(`t('...') literal call sites scanned: ${[...literalUses.values()].reduce((n, s) => n + s.size, 0)} (${literalUses.size} unique keys)`)
  console.log('')

  console.log(`[1] Defined in en.json but never referenced: ${unusedKeys.length}`)
  if (unusedKeys.length) {
    for (const key of unusedKeys) console.log(`    ${key}`)
  }
  console.log('')

  console.log(`[2] Referenced but not defined in en.json: ${undefinedKeys.length}`)
  if (undefinedKeys.length) {
    for (const { key, locations } of undefinedKeys) {
      console.log(`    ${key}`)
      for (const loc of locations) console.log(`        <- ${loc}`)
    }
  }
  console.log('')

  console.log(`[3] In en.json, missing from tr.json: ${enMissingInTr.length}`)
  for (const key of enMissingInTr) console.log(`    ${key}`)
  console.log('')

  console.log(`[4] In tr.json, missing from en.json: ${trMissingInEn.length}`)
  for (const key of trMissingInEn) console.log(`    ${key}`)
  console.log('')

  console.log(`Unresolved (dynamic key construction, not checked): ${unresolved.length}`)
  if (unresolved.length) {
    for (const { location, raw } of unresolved) console.log(`    ${location}  \`${raw}\``)
  }
  console.log(line)

  const hasRealProblems = undefinedKeys.length > 0 || enMissingInTr.length > 0 || trMissingInEn.length > 0
  if (hasRealProblems) {
    console.log('FAIL: category 2/3/4 issues found (see above).')
    process.exitCode = 1
  } else {
    console.log('OK: no undefined keys or locale mismatches. (Unused keys and unresolved dynamic calls are informational only.)')
  }
}

main()
