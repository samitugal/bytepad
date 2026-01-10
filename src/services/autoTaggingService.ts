// Auto-Tagging Service
// AI-powered automatic tag suggestions for notes and bookmarks

import { useNoteStore } from '../stores/noteStore'
import { useBookmarkStore } from '../stores/bookmarkStore'

interface TagSuggestion {
    tag: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
}

// Common tag categories
const TAG_CATEGORIES: Record<string, string[]> = {
    technology: ['javascript', 'typescript', 'react', 'python', 'api', 'database', 'frontend', 'backend', 'devops', 'cloud', 'ai', 'ml', 'programming', 'code', 'software', 'web', 'mobile', 'app'],
    productivity: ['todo', 'task', 'project', 'planning', 'meeting', 'notes', 'ideas', 'brainstorm', 'workflow', 'automation', 'efficiency'],
    learning: ['tutorial', 'course', 'documentation', 'guide', 'howto', 'reference', 'learning', 'education', 'study'],
    work: ['work', 'business', 'client', 'project', 'deadline', 'report', 'presentation', 'meeting'],
    personal: ['personal', 'health', 'fitness', 'hobby', 'travel', 'food', 'recipe', 'entertainment'],
    finance: ['finance', 'money', 'budget', 'investment', 'crypto', 'stocks', 'savings'],
    design: ['design', 'ui', 'ux', 'figma', 'css', 'styling', 'animation', 'graphics'],
    research: ['research', 'paper', 'article', 'study', 'analysis', 'data', 'statistics'],
}

// Keywords that strongly indicate certain tags
const KEYWORD_TAG_MAP: Record<string, string[]> = {
    react: ['react', 'jsx', 'component', 'hook', 'useState', 'useEffect'],
    typescript: ['typescript', 'ts', 'interface', 'type', 'generic'],
    python: ['python', 'pip', 'django', 'flask', 'pandas', 'numpy'],
    api: ['api', 'rest', 'graphql', 'endpoint', 'fetch', 'axios'],
    database: ['database', 'sql', 'mongodb', 'postgres', 'mysql', 'redis'],
    tutorial: ['tutorial', 'how to', 'guide', 'step by step', 'learn'],
    productivity: ['productivity', 'efficient', 'workflow', 'organize'],
    meeting: ['meeting', 'agenda', 'minutes', 'discussion', 'attendees'],
    ideas: ['idea', 'brainstorm', 'concept', 'proposal', 'suggestion'],
    todo: ['todo', 'task', 'action item', 'checklist'],
}

// Extract potential tags from text content
function extractTagsFromContent(content: string, title: string): TagSuggestion[] {
    const suggestions: TagSuggestion[] = []
    const text = `${title} ${content}`.toLowerCase()
    const existingTags = new Set<string>()

    // Check keyword-tag mappings
    for (const [tag, keywords] of Object.entries(KEYWORD_TAG_MAP)) {
        const matchCount = keywords.filter(kw => text.includes(kw)).length
        if (matchCount >= 2) {
            if (!existingTags.has(tag)) {
                suggestions.push({
                    tag,
                    confidence: 'high',
                    reason: `Found ${matchCount} related keywords`,
                })
                existingTags.add(tag)
            }
        } else if (matchCount === 1) {
            if (!existingTags.has(tag)) {
                suggestions.push({
                    tag,
                    confidence: 'medium',
                    reason: 'Found related keyword',
                })
                existingTags.add(tag)
            }
        }
    }

    // Check category keywords
    for (const [category, keywords] of Object.entries(TAG_CATEGORIES)) {
        const matchCount = keywords.filter(kw => text.includes(kw)).length
        if (matchCount >= 3 && !existingTags.has(category)) {
            suggestions.push({
                tag: category,
                confidence: 'medium',
                reason: `Content relates to ${category}`,
            })
            existingTags.add(category)
        }
    }

    // Extract hashtags from content
    const hashtagPattern = /#(\w+)/g
    let match
    while ((match = hashtagPattern.exec(content)) !== null) {
        const tag = match[1].toLowerCase()
        if (!existingTags.has(tag)) {
            suggestions.push({
                tag,
                confidence: 'high',
                reason: 'Explicit hashtag in content',
            })
            existingTags.add(tag)
        }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.confidence] - order[b.confidence]
    }).slice(0, 5) // Max 5 suggestions
}

// Extract tags from URL for bookmarks
function extractTagsFromUrl(url: string, title: string): TagSuggestion[] {
    const suggestions: TagSuggestion[] = []
    const existingTags = new Set<string>()

    try {
        const urlObj = new URL(url)
        const domain = urlObj.hostname.replace('www.', '')
        const path = urlObj.pathname.toLowerCase()

        // Domain-based tags
        const domainTags: Record<string, string[]> = {
            'github.com': ['github', 'code', 'opensource'],
            'stackoverflow.com': ['stackoverflow', 'programming', 'qa'],
            'medium.com': ['article', 'blog', 'reading'],
            'dev.to': ['dev', 'programming', 'blog'],
            'youtube.com': ['video', 'youtube'],
            'twitter.com': ['twitter', 'social'],
            'x.com': ['twitter', 'social'],
            'linkedin.com': ['linkedin', 'professional'],
            'reddit.com': ['reddit', 'discussion'],
            'notion.so': ['notion', 'productivity'],
            'figma.com': ['figma', 'design'],
            'dribbble.com': ['design', 'inspiration'],
            'npmjs.com': ['npm', 'package', 'javascript'],
            'docs.google.com': ['google-docs', 'document'],
        }

        if (domainTags[domain]) {
            domainTags[domain].forEach(tag => {
                if (!existingTags.has(tag)) {
                    suggestions.push({
                        tag,
                        confidence: 'high',
                        reason: `From ${domain}`,
                    })
                    existingTags.add(tag)
                }
            })
        }

        // Path-based tags
        const pathParts = path.split('/').filter(p => p.length > 2)
        pathParts.forEach(part => {
            // Check if part matches any known tag
            for (const [tag, keywords] of Object.entries(KEYWORD_TAG_MAP)) {
                if (keywords.some(kw => part.includes(kw)) && !existingTags.has(tag)) {
                    suggestions.push({
                        tag,
                        confidence: 'medium',
                        reason: 'Found in URL path',
                    })
                    existingTags.add(tag)
                    break
                }
            }
        })

    } catch {
        // Invalid URL, skip URL-based extraction
    }

    // Also check title
    const titleSuggestions = extractTagsFromContent(title, '')
    titleSuggestions.forEach(s => {
        if (!existingTags.has(s.tag)) {
            suggestions.push(s)
            existingTags.add(s.tag)
        }
    })

    return suggestions.slice(0, 5)
}

// Get tag suggestions for a note
export function suggestTagsForNote(noteId: string): TagSuggestion[] {
    const notes = useNoteStore.getState().notes
    const note = notes.find(n => n.id === noteId)

    if (!note) return []

    return extractTagsFromContent(note.content, note.title)
}

// Get tag suggestions for a bookmark
export function suggestTagsForBookmark(bookmarkId: string): TagSuggestion[] {
    const bookmarks = useBookmarkStore.getState().bookmarks
    const bookmark = bookmarks.find(b => b.id === bookmarkId)

    if (!bookmark) return []

    return extractTagsFromUrl(bookmark.url, bookmark.title)
}

// Get tag suggestions for new content (before saving)
export function suggestTagsForContent(content: string, title: string): TagSuggestion[] {
    return extractTagsFromContent(content, title)
}

// Get tag suggestions for new bookmark URL
export function suggestTagsForUrl(url: string, title: string): TagSuggestion[] {
    return extractTagsFromUrl(url, title)
}

// Get all existing tags in the system for autocomplete
export function getAllExistingTags(): string[] {
    const notes = useNoteStore.getState().notes
    const bookmarks = useBookmarkStore.getState().bookmarks

    const tagSet = new Set<string>()

    notes.forEach(note => {
        note.tags.forEach(tag => tagSet.add(tag.toLowerCase()))
    })

    bookmarks.forEach(bookmark => {
        bookmark.tags.forEach(tag => tagSet.add(tag.toLowerCase()))
    })

    return Array.from(tagSet).sort()
}

// Format suggestions for display
export function formatTagSuggestions(suggestions: TagSuggestion[]): string {
    if (suggestions.length === 0) {
        return 'No tag suggestions available.'
    }

    let text = '**Suggested Tags:**\n'
    suggestions.forEach(s => {
        const icon = s.confidence === 'high' ? '🟢' : s.confidence === 'medium' ? '🟡' : '⚪'
        text += `${icon} \`${s.tag}\` - ${s.reason}\n`
    })

    return text
}
