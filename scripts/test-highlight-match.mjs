import assert from 'node:assert/strict'
import { getHighlightParts } from '../src/components/common/highlightMatch.mjs'

const highlighted = (text, query) => getHighlightParts(text, query).filter((part) => part.highlighted).map((part) => part.text)

assert.deepEqual(highlighted('Alpha beta alpha', 'alpha'), ['Alpha', 'alpha'])
assert.deepEqual(highlighted('file [name].txt', '[name]'), ['[name]'])
assert.deepEqual(highlighted('No matching text', 'zzz'), [])
assert.deepEqual(highlighted('Taggable note', '#taggable'), ['Taggable'])
assert.deepEqual(getHighlightParts('plain text', ''), [{ text: 'plain text', highlighted: false }])

console.log('highlight-match tests passed')
