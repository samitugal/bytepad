import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { resolveTranslation } from '../src/i18n/lookup.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const en = JSON.parse(readFileSync(join(root, '../src/i18n/en.json'), 'utf8'))
const tr = JSON.parse(readFileSync(join(root, '../src/i18n/tr.json'), 'utf8'))

const catalogs = { en, tr }

const present = resolveTranslation(catalogs, 'tr', 'common.save')
assert.equal(present.value, tr.common.save)
assert.equal(present.usedFallback, false)

const english = resolveTranslation(catalogs, 'en', 'common.save')
assert.equal(english.value, en.common.save)
assert.equal(english.usedFallback, false)

const trWithoutSave = { ...tr, common: { ...tr.common } }
delete trWithoutSave.common.save
const fallback = resolveTranslation({ en, tr: trWithoutSave }, 'tr', 'common.save')
assert.equal(fallback.value, en.common.save)
assert.equal(fallback.usedFallback, true)

const missing = resolveTranslation(catalogs, 'tr', 'does.not.exist')
assert.equal(missing.value, undefined)
assert.equal(missing.usedFallback, false)

const missingOnEnglish = resolveTranslation(catalogs, 'en', 'does.not.exist')
assert.equal(missingOnEnglish.value, undefined)
assert.equal(missingOnEnglish.usedFallback, false)

const emptyCatalogs = { en: { common: { save: 'Save' } }, tr: {} }
const nestedMiss = resolveTranslation(emptyCatalogs, 'tr', 'common.save')
assert.equal(nestedMiss.value, 'Save')
assert.equal(nestedMiss.usedFallback, true)

console.log('i18n-fallback tests passed')
