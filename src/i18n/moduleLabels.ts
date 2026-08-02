import type { ModuleType } from '../types'

/**
 * Single source of truth for module -> display label.
 *
 * Sidebar and TabBar both need a human-readable name for a ModuleType.
 * Deriving the i18n key from the module id by string manipulation (e.g.
 * `nav.${id}`) breaks silently: some modules key off `nav.*` (lowercase,
 * matches the id) while others key off a dedicated section with different
 * casing (`dailynotes` -> `dailyNotes.title`, `ideas` -> `ideas.title`).
 * A missing/mismatched key doesn't throw - getNestedValue() in ./index.ts
 * returns the raw key path, which is truthy, so `t(key) || id` fallbacks
 * never engage either.
 *
 * Keeping this map as `Record<ModuleType, string>` makes an unmapped
 * module a compile error instead of a silently-wrong label at runtime:
 * adding a case to ModuleType without adding it here fails `tsc -b`.
 */
export function getModuleLabel(t: (key: string) => string, id: ModuleType): string {
  const labels: Record<ModuleType, string> = {
    notes: t('nav.notes'),
    dailynotes: t('dailyNotes.title'),
    ideas: t('ideas.title'),
    habits: t('nav.habits'),
    tasks: t('nav.tasks'),
    journal: t('nav.journal'),
    bookmarks: t('nav.bookmarks'),
    calendar: t('nav.calendar'),
    graph: t('nav.graph'),
    analysis: t('nav.analysis'),
  }
  return labels[id]
}
