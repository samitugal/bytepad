import { useState } from 'react'
import { NoteList } from './NoteList'
import { NoteEditor } from './NoteEditor'
import { KnowledgeGraph } from './KnowledgeGraph'

export function NotesModule() {
  const [showGraph, setShowGraph] = useState(false)

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <NoteList />
      <NoteEditor />
      
      {/* Knowledge Graph Button */}
      <button
        onClick={() => setShowGraph(true)}
        className="absolute bottom-4 right-4 bg-np-bg-secondary border border-np-border px-3 py-2 text-xs text-np-text-secondary hover:text-np-cyan hover:border-np-cyan transition-colors"
        title="Open Knowledge Graph"
      >
        🕸️ Graph
      </button>

      {/* Knowledge Graph Modal */}
      <KnowledgeGraph isOpen={showGraph} onClose={() => setShowGraph(false)} />
    </div>
  )
}
