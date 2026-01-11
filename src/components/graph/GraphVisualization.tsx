import { useRef, useEffect, useState, useCallback } from 'react'
import type { GraphNode, GraphEdge, GraphEntityType } from '../../types'
import { nodeColors } from '../../utils/graphUtils'

interface GraphVisualizationProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  searchQuery: string
  onNodeClick: (nodeId: string, nodeType: GraphEntityType) => void
}

export function GraphVisualization({
  nodes,
  edges,
  searchQuery,
  onNodeClick,
}: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const animationRef = useRef<number>()
  const nodesRef = useRef<GraphNode[]>([])

  useEffect(() => {
    nodesRef.current = nodes.map(n => ({ ...n }))
  }, [nodes])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    const centerX = width / 2
    const centerY = height / 2
    const simNodes = nodesRef.current

    if (simNodes.length === 0) return

    const simulate = () => {
      simNodes.forEach((node) => {
        node.vx += (centerX - node.x) * 0.0008
        node.vy += (centerY - node.y) * 0.0008

        simNodes.forEach((other) => {
          if (node.id === other.id) return
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 800 / (dist * dist)
          node.vx += (dx / dist) * force
          node.vy += (dy / dist) * force
        })
      })

      edges.forEach((edge) => {
        const source = simNodes.find((n) => n.id === edge.source)
        const target = simNodes.find((n) => n.id === edge.target)
        if (!source || !target) return

        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 120) * 0.008

        source.vx += (dx / dist) * force
        source.vy += (dy / dist) * force
        target.vx -= (dx / dist) * force
        target.vy -= (dy / dist) * force
      })

      simNodes.forEach((node) => {
        node.vx *= 0.92
        node.vy *= 0.92
        node.x += node.vx
        node.y += node.vy

        node.x = Math.max(60, Math.min(width - 60, node.x))
        node.y = Math.max(60, Math.min(height - 60, node.y))
      })

      ctx.fillStyle = '#1E1E1E'
      ctx.fillRect(0, 0, width, height)

      edges.forEach((edge) => {
        const source = simNodes.find((n) => n.id === edge.source)
        const target = simNodes.find((n) => n.id === edge.target)
        if (!source || !target) return

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.strokeStyle = edge.type === 'tag' ? 'rgba(220, 220, 170, 0.3)' : 'rgba(80, 80, 80, 0.5)'
        ctx.lineWidth = edge.type === 'wikilink' ? 1.5 : 1
        ctx.stroke()
      })

      const query = searchQuery.toLowerCase()

      simNodes.forEach((node) => {
        const isHovered = hoveredNode?.id === node.id
        const isSelected = selectedNode === node.id
        const isHighlighted = query && node.label.toLowerCase().includes(query)
        const radius = Math.min(8 + node.connections * 1.5, 20)

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
        
        let fillColor = nodeColors[node.type]
        if (query && !isHighlighted) {
          fillColor = 'rgba(60, 60, 60, 0.5)'
        }
        
        ctx.fillStyle = fillColor
        ctx.fill()

        if (isHovered || isSelected || isHighlighted) {
          ctx.strokeStyle = isSelected ? '#FFFFFF' : isHighlighted ? '#FFD700' : '#D4D4D4'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        if (isHovered || isSelected || isHighlighted || node.connections > 2) {
          ctx.fillStyle = query && !isHighlighted ? 'rgba(128, 128, 128, 0.5)' : '#D4D4D4'
          ctx.font = '11px JetBrains Mono, monospace'
          ctx.textAlign = 'center'
          const label = node.label.length > 18 ? node.label.substring(0, 15) + '...' : node.label
          ctx.fillText(label, node.x, node.y + radius + 14)
        }
      })

      animationRef.current = requestAnimationFrame(simulate)
    }

    simulate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, edges, searchQuery, hoveredNode, selectedNode])

  const findNodeAtPosition = useCallback((x: number, y: number): GraphNode | null => {
    const simNodes = nodesRef.current
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const node = simNodes[i]
      const radius = Math.min(8 + node.connections * 1.5, 20)
      const dx = node.x - x
      const dy = node.y - y
      if (Math.sqrt(dx * dx + dy * dy) < radius + 5) {
        return node
      }
    }
    return null
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const hovered = findNodeAtPosition(x, y)
    setHoveredNode(hovered)
    canvas.style.cursor = hovered ? 'pointer' : 'default'
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clicked = findNodeAtPosition(x, y)
    if (clicked) {
      setSelectedNode(clicked.id)
      const [type] = clicked.id.split(':') as [GraphEntityType]
      onNodeClick(clicked.id, type)
    } else {
      setSelectedNode(null)
    }
  }

  return (
    <div ref={containerRef} className="flex-1 relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full h-full"
      />

      {hoveredNode && (
        <div 
          className="absolute bottom-4 left-4 bg-np-bg-tertiary border border-np-border px-3 py-2 text-sm pointer-events-none"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: nodeColors[hoveredNode.type] }}
            />
            <span className="text-np-text-primary font-medium">{hoveredNode.label}</span>
          </div>
          <div className="text-xs text-np-text-secondary">
            {hoveredNode.type.charAt(0).toUpperCase() + hoveredNode.type.slice(1)} • {hoveredNode.connections} connection{hoveredNode.connections !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-np-text-secondary">
          No nodes to display. Enable filters to see your knowledge graph.
        </div>
      )}
    </div>
  )
}
