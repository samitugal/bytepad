import { useState, useRef, useEffect, useCallback, ReactNode } from 'react'

interface ResizablePanelProps {
    children: ReactNode
    storageKey: string
    defaultWidth?: number
    minWidth?: number
    maxWidth?: number
    side?: 'left' | 'right'
    className?: string
}

export function ResizablePanel({
    children,
    storageKey,
    defaultWidth = 280,
    minWidth = 200,
    maxWidth = 500,
    side = 'right',
    className = '',
}: ResizablePanelProps) {
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem(`bytepad-panel-${storageKey}`)
        return saved ? parseInt(saved, 10) : defaultWidth
    })
    const [isResizing, setIsResizing] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    // Save width to localStorage
    useEffect(() => {
        localStorage.setItem(`bytepad-panel-${storageKey}`, width.toString())
    }, [width, storageKey])

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }, [])

    const stopResizing = useCallback(() => {
        setIsResizing(false)
    }, [])

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing || !panelRef.current) return

        const rect = panelRef.current.getBoundingClientRect()
        let newWidth: number

        if (side === 'right') {
            newWidth = e.clientX - rect.left
        } else {
            newWidth = rect.right - e.clientX
        }

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setWidth(newWidth)
        }
    }, [isResizing, side, minWidth, maxWidth])

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResizing)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, resize, stopResizing])

    const handlePosition = side === 'right' ? 'right-0' : 'left-0'

    return (
        <div
            ref={panelRef}
            className={`relative flex-shrink-0 ${className}`}
            style={{ width: `${width}px` }}
        >
            {children}

            {/* Resize handle */}
            <div
                className={`absolute top-0 ${handlePosition} w-1 h-full cursor-col-resize 
                    hover:bg-np-blue/50 transition-colors z-10 ${isResizing ? 'bg-np-blue' : ''
                    }`}
                onMouseDown={startResizing}
            />
        </div>
    )
}
