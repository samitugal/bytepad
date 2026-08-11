import { getHighlightParts as getRuntimeHighlightParts } from './highlightMatch.mjs'

export interface HighlightPart {
  text: string
  highlighted: boolean
}

export function getHighlightParts(text: string, query: string): HighlightPart[] {
  return getRuntimeHighlightParts(text, query) as HighlightPart[]
}
