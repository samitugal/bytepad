export interface HighlightPart {
  text: string;
  highlighted: boolean;
}

export function getHighlightParts(text: string, query: string): HighlightPart[];
