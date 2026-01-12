import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import en from './en.json'
import tr from './tr.json'

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

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: unknown, path: string): string {
    const keys = path.split('.')
    let current: unknown = obj

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = (current as Record<string, unknown>)[key]
        } else {
            return path // Return the path if not found
        }
    }

    return typeof current === 'string' ? current : path
}

// Hook to get translation function
export function useTranslation() {
    const { language } = useI18nStore()

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations[language], key)

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
    return getNestedValue(translations[lang], key)
}
