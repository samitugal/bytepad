import { useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { Task } from '../../types'

type KanbanStatus = 'todo' | 'in_progress' | 'done'

interface TaskKanbanProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onEditTask: (id: string) => void
  onDeleteTask: (id: string, title: string) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'np-orange' },
  { id: 'in_progress', label: 'In Progress', color: 'np-blue' },
  { id: 'done', label: 'Done', color: 'np-green' },
]

// Get kanban status from task
function getTaskStatus(task: Task): KanbanStatus {
  if (task.completed) return 'done'
  if (task.kanbanStatus === 'in_progress') return 'in_progress'
  return 'todo'
}

// Sortable Task Card
function SortableTaskCard({ task, onEdit, onDelete, t }: {
  task: Task
  onEdit: () => void
  onDelete: () => void
  t: (key: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColors: Record<string, string> = {
    P1: 'text-np-error',
    P2: 'text-np-orange',
    P3: 'text-np-yellow',
    P4: 'text-np-text-secondary',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-np-bg-primary border border-np-border p-3 cursor-grab active:cursor-grabbing
                  hover:border-np-blue/50 transition-colors ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono ${priorityColors[task.priority]}`}>
              [{task.priority}]
            </span>
            <span className={`text-sm ${task.completed ? 'line-through text-np-text-secondary' : 'text-np-text-primary'}`}>
              {task.title}
            </span>
          </div>
          
          {task.description && (
            <p className="text-xs text-np-text-secondary line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {task.deadline && (
              <span className="text-[10px] text-np-orange">
                📅 {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="text-[10px] text-np-text-secondary">
                ✓ {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <span className="text-[10px] text-np-purple">
                #{task.tags[0]}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-np-text-secondary hover:text-np-blue text-xs p-1"
            title={t('common.edit')}
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-np-text-secondary hover:text-np-error text-xs p-1"
            title={t('common.delete')}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

// Task Card for Drag Overlay
function TaskCardOverlay({ task }: { task: Task }) {
  const priorityColors: Record<string, string> = {
    P1: 'text-np-error',
    P2: 'text-np-orange',
    P3: 'text-np-yellow',
    P4: 'text-np-text-secondary',
  }

  return (
    <div className="bg-np-bg-primary border-2 border-np-blue p-3 shadow-xl">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono ${priorityColors[task.priority]}`}>
          [{task.priority}]
        </span>
        <span className="text-sm text-np-text-primary">{task.title}</span>
      </div>
    </div>
  )
}

// Droppable Column Content
function DroppableColumnContent({ 
  columnId, 
  children,
  isEmpty
}: { 
  columnId: string
  children: React.ReactNode
  isEmpty: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] transition-colors ${
        isOver ? 'bg-np-bg-hover' : ''
      }`}
    >
      {children}
      {isEmpty && (
        <div className={`text-center text-np-text-secondary text-xs py-8 border border-dashed transition-colors ${
          isOver ? 'border-np-blue bg-np-selection' : 'border-np-border'
        }`}>
          Drop tasks here
        </div>
      )}
    </div>
  )
}

// Kanban Column
function KanbanColumn({ 
  column, 
  tasks, 
  onEditTask, 
  onDeleteTask,
  t 
}: {
  column: typeof COLUMNS[0]
  tasks: Task[]
  onEditTask: (id: string) => void
  onDeleteTask: (id: string, title: string) => void
  t: (key: string) => string
}) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px] flex flex-col bg-np-bg-secondary border border-np-border">
      {/* Column Header */}
      <div className={`px-3 py-2 border-b border-np-border flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-${column.color}`}></span>
          <span className="text-sm font-medium text-np-text-primary">{column.label}</span>
        </div>
        <span className="text-xs bg-np-bg-tertiary px-2 py-0.5 text-np-text-secondary">
          {tasks.length}
        </span>
      </div>

      {/* Column Content - Droppable */}
      <DroppableColumnContent columnId={column.id} isEmpty={tasks.length === 0}>
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task.id)}
              onDelete={() => onDeleteTask(task.id, task.title)}
              t={t}
            />
          ))}
        </SortableContext>
      </DroppableColumnContent>
    </div>
  )
}

export function TaskKanban({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onUpdateTask,
  t,
}: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<KanbanStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }

    tasks.forEach((task) => {
      const status = getTaskStatus(task)
      grouped[status].push(task)
    })

    // Sort by priority within each column
    const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 }
    Object.keys(grouped).forEach((status) => {
      grouped[status as KanbanStatus].sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      )
    })

    return grouped
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Determine which column the task was dropped in
    const overId = over.id as string
    
    // Check if dropped on a column or another task
    let targetStatus: KanbanStatus | null = null

    // Check if dropped directly on a column (droppable area)
    if (['todo', 'in_progress', 'done'].includes(overId)) {
      targetStatus = overId as KanbanStatus
    } else {
      // Dropped on another task or on itself - find which column that task is in
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        targetStatus = getTaskStatus(overTask)
      } else if (overId === taskId) {
        // Dropped on itself - no change needed
        return
      }
    }

    if (!targetStatus) return

    const currentStatus = getTaskStatus(task)
    if (currentStatus === targetStatus) return
    
    console.log('Kanban: Moving task', taskId, 'from', currentStatus, 'to', targetStatus)

    // Update task based on new status
    if (targetStatus === 'done') {
      onToggleTask(taskId) // Mark as completed
    } else if (targetStatus === 'todo') {
      if (task.completed) {
        onToggleTask(taskId) // Unmark completed
      }
      onUpdateTask(taskId, { kanbanStatus: 'todo' })
    } else if (targetStatus === 'in_progress') {
      if (task.completed) {
        onToggleTask(taskId) // Unmark completed
      }
      onUpdateTask(taskId, { kanbanStatus: 'in_progress' })
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  }

  return (
    <div className="flex-1 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 h-full overflow-x-auto p-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id]}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              t={t}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCardOverlay task={activeTask} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
