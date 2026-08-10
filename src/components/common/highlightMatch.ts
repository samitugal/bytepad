export interface HighlightPart {
  text: string
  highlighted: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getHighlightParts(text: string, query: string): HighlightPart[] {
  const normalizedQuery = query.trim().replace(/^#/, '')
  if (!normalizedQuery) return [{ text, highlighted: false }]

  const matcher = new RegExp(escapeRegExp(normalizedQuery), 'gi')
  const parts: HighlightPart[] = []
  let cursor = 0

  for (const match of text.matchAll(matcher)) {
    const start = match.index ?? 0
    const matchedText = match[0]
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start), highlighted: false })
    }
    parts.push({ text: matchedText, highlighted: true })
    cursor = start + matchedText.length
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlighted: false })
  }

  return parts.length > 0 ? parts : [{ text, highlighted: false }]
}
