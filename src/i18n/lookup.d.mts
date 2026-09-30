export function getNestedValue(obj: unknown, path: string): string | undefined

export function resolveTranslation(
    catalogs: Record<string, unknown>,
    language: string,
    key: string,
    fallbackLanguage?: string
): { value: string | undefined; usedFallback: boolean }
