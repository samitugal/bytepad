import { useMemo, useRef, useEffect, useState } from 'react'
import { useNoteStore } from '../../stores/noteStore'

interface GraphNode {
  id: string
  title: string
  x: number
  y: number
  vx: number
  vy: number
  links: number
}

interface GraphLink {
  source: string
  target: string
}

interface KnowledgeGraphProps {
  isOpen: boolean
  onClose: () => void
}

// Extract [[wikilinks]] from content
function extractWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].toLowerCase())
  }
  return links
}

export function KnowledgeGraph({ isOpen, onClose }: KnowledgeGraphProps) {
  const notes = useNoteStore((s) => s.notes)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const animationRef = useRef<number>()

  // Build graph data
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>()
    const linkSet = new Set<string>()
    const links: GraphLink[] = []

    // Create nodes for all notes
    notes.forEach((note, index) => {
      const angle = (2 * Math.PI * index) / notes.length
      const radius = 150
      nodeMap.set(note.id, {
        id: note.id,
        title: note.title,
        x: 300 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        links: 0,
      })
    })

    // Create links based on wikilinks
    notes.forEach((note) => {
      const wikilinks = extractWikilinks(note.content)
      wikilinks.forEach((linkTitle) => {
        // Find target note by title (case-insensitive)
        const targetNote = notes.find(
          (n) => n.title.toLowerCase() === linkTitle
        )
        if (targetNote && targetNote.id !== note.id) {
          const linkKey = [note.id, targetNote.id].sort().join('-')
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey)
            links.push({ source: note.id, target: targetNote.id })
            
            // Increment link counts
            const sourceNode = nodeMap.get(note.id)
            const targetNode = nodeMap.get(targetNote.id)
            if (sourceNode) sourceNode.links++
            if (targetNode) targetNode.links++
          }
        }
      })
    })

    return { nodes: Array.from(nodeMap.values()), links }
  }, [notes])

  // Force simulation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    const simulate = () => {
      // Apply forces
      nodes.forEach((node) => {
        // Center gravity
        node.vx += (centerX - node.x) * 0.001
        node.vy += (centerY - node.y) * 0.001

        // Repulsion from other nodes
        nodes.forEach((other) => {
          if (node.id === other.id) return
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 1000 / (dist * dist)
          node.vx += (dx / dist) * force
          node.vy += (dy / dist) * force
        })
      })

      // Apply link forces
      links.forEach((link) => {
        const source = nodes.find((n) => n.id === link.source)
        const target = nodes.find((n) => n.id === link.target)
        if (!source || !target) return

        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 100) * 0.01

        source.vx += (dx / dist) * force
        source.vy += (dy / dist) * force
        target.vx -= (dx / dist) * force
        target.vy -= (dy / dist) * force
      })

      // Update positions with damping
      nodes.forEach((node) => {
        node.vx *= 0.9
        node.vy *= 0.9
        node.x += node.vx
        node.y += node.vy

        // Keep in bounds
        node.x = Math.max(50, Math.min(width - 50, node.x))
        node.y = Math.max(50, Math.min(height - 50, node.y))
      })

      // Draw
      ctx.fillStyle = '#1E1E1E'
      ctx.fillRect(0, 0, width, height)

      // Draw links
      ctx.strokeStyle = '#3C3C3C'
      ctx.lineWidth = 1
      links.forEach((link) => {
        const source = nodes.find((n) => n.id === link.source)
        const target = nodes.find((n) => n.id === link.target)
        if (!source || !target) return

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNode === node.id
        const radius = 6 + node.links * 2

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = isSelected
          ? '#569CD6'
          : isHovered
          ? '#4EC9B0'
          : node.links > 0
          ? '#6A9955'
          : '#808080'
        ctx.fill()

        if (isHovered || isSelected) {
          ctx.strokeStyle = '#D4D4D4'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Draw label
        ctx.fillStyle = '#D4D4D4'
        ctx.font = '11px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(node.title.substring(0, 15), node.x, node.y + radius + 14)
      })

      animationRef.current = requestAnimationFrame(simulate)
    }

    simulate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isOpen, nodes, links, hoveredNode, selectedNode])

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hovered = nodes.find((node) => {
      const dx = node.x - x
      const dy = node.y - y
      return Math.sqrt(dx * dx + dy * dy) < 15
    })

    setHoveredNode(hovered || null)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clicked = nodes.find((node) => {
      const dx = node.x - x
      const dy = node.y - y
      return Math.sqrt(dx * dx + dy * dy) < 15
    })

    if (clicked) {
      setSelectedNode(clicked.id)
      setActiveNote(clicked.id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-np-bg-secondary border border-np-border shadow-2xl w-[700px] h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-np-border">
          <h3 className="text-np-text-primary font-mono">
            <span className="text-np-green">// </span>Knowledge Graph
          </h3>
          <div className="flex items-center gap-4 text-xs text-np-text-secondary">
            <span>{nodes.length} notes</span>
            <span>{links.length} links</span>
            <button onClick={onClose} className="text-np-text-secondary hover:text-np-error">
              ✕
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={700}
          height={450}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          className="cursor-pointer"
        />

        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-np-bg-tertiary border border-np-border px-2 py-1 text-xs">
            <span className="text-np-cyan">{hoveredNode.title}</span>
            <span className="text-np-text-secondary ml-2">
              {hoveredNode.links} connection{hoveredNode.links !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Help */}
        <div className="absolute bottom-4 right-4 text-xs text-np-text-secondary">
          Use <code className="bg-np-bg-tertiary px-1">[[Note Title]]</code> to link notes
        </div>
      </div>
    </div>
  )
}
