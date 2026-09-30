export function getNestedValue(obj, path) {
    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key]
        } else {
            return undefined
        }
    }

    return typeof current === 'string' ? current : undefined
}

export function resolveTranslation(catalogs, language, key, fallbackLanguage = 'en') {
    const local = getNestedValue(catalogs[language], key)
    if (local !== undefined) return { value: local, usedFallback: false }
    if (language === fallbackLanguage) return { value: undefined, usedFallback: false }

    const fallback = getNestedValue(catalogs[fallbackLanguage], key)
    if (fallback !== undefined) return { value: fallback, usedFallback: true }
    return { value: undefined, usedFallback: false }
}
