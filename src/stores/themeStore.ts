import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
    theme: Theme
    resolvedTheme: 'dark' | 'light'
    setTheme: (theme: Theme) => void
}

function getSystemTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)

    if (theme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
    } else {
        root.classList.add('light')
        root.classList.remove('dark')
    }
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark',
            resolvedTheme: 'dark',

            setTheme: (theme) => {
                const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
                applyTheme(resolvedTheme)
                set({ theme, resolvedTheme })
            },
        }),
        {
            name: 'bytepad-theme',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const resolvedTheme = state.theme === 'system' ? getSystemTheme() : state.theme
                    applyTheme(resolvedTheme)
                    state.resolvedTheme = resolvedTheme
                }
            },
        }
    )
)

// Listen for system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const state = useThemeStore.getState()
        if (state.theme === 'system') {
            const resolvedTheme = e.matches ? 'dark' : 'light'
            applyTheme(resolvedTheme)
            useThemeStore.setState({ resolvedTheme })
        }
    })
}
