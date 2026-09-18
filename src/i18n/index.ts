import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import en from './en.json'
import tr from './tr.json'
import { resolveTranslation as lookupTranslation } from './lookup.mjs'

export type Language = 'en' | 'tr'

export const LANGUAGES: { id: Language; label: string; nativeLabel: string }[] = [
    { id: 'en', label: 'English', nativeLabel: 'English' },
    { id: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
]

type TranslationData = typeof en

const translations: Record<Language, TranslationData> = {
    en,
    tr,
}

interface I18nState {
    language: Language
    setLanguage: (lang: Language) => void
}

export const useI18nStore = create<I18nState>()(
    persist(
        (set) => ({
            language: 'en',
            setLanguage: (language) => set({ language }),
        }),
        {
            name: 'bytepad-i18n',
        }
    )
)

// What an unguarded missing key renders as: the key path in development
// (loud, so it's spotted) and empty string in production (graceful, so a
// user never sees a raw key like "nav.dailynotes").
function missingKeyFallback(key: string): string {
    return import.meta.env.DEV ? key : ''
}

function resolveTranslation(language: Language, key: string): string | undefined {
    const { value, usedFallback } = lookupTranslation(translations, language, key)
    if (usedFallback && import.meta.env.DEV) {
        console.warn(`[i18n] missing "${key}" in "${language}", falling back to English`)
    }
    return value
}

// Hook to get translation function
export function useTranslation() {
    const { language } = useI18nStore()

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = resolveTranslation(language, key) ?? missingKeyFallback(key)

        // Replace parameters like {name} with actual values
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
            })
        }

        return text
    }

    return { t, language }
}

// Direct translation function for use outside React components
export function translate(key: string, language?: Language): string {
    const lang = language || useI18nStore.getState().language
    return resolveTranslation(lang, key) ?? missingKeyFallback(key)
}
