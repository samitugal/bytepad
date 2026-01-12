import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableTaskItem, CompletedTaskItem } from './TaskItem'
import type { Task } from '../../types'

interface TaskListProps {
  activeTasks: Task[]
  completedTasks: Task[]
  expandedTask: string | null
  setExpandedTask: (id: string | null) => void
  newSubtaskTitle: string
  setNewSubtaskTitle: (title: string) => void
  showDoneSection: boolean
  setShowDoneSection: (show: boolean) => void
  sortBy: 'priority' | 'deadline' | 'created' | 'manual'
  filter: 'all' | 'active' | 'completed'
  // Actions
  onToggleTask: (id: string) => void
  onEditTask: (id: string) => void
  onDeleteTask: (id: string, title: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onAddSubtask: (taskId: string) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onReorderTasks: (taskIds: string[]) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function TaskList({
  activeTasks,
  completedTasks,
  expandedTask,
  setExpandedTask,
  newSubtaskTitle,
  setNewSubtaskTitle,
  showDoneSection,
  setShowDoneSection,
  sortBy,
  filter,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
  onUpdateTask,
  onReorderTasks,
  t,
}: TaskListProps) {
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end - reorder tasks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = activeTasks.findIndex(t => t.id === active.id)
      const newIndex = activeTasks.findIndex(t => t.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(activeTasks, oldIndex, newIndex)
        const taskIds = reorderedTasks.map(t => t.id)
        onReorderTasks(taskIds)
      }
    }
  }

  const doneCount = completedTasks.length

  return (
    <div className="flex-1 overflow-y-auto">
      {activeTasks.length === 0 && filter !== 'completed' ? (
        <div className="text-center text-np-text-secondary py-8">
          <div className="text-np-green mb-2">// {t('tasks.noActiveTasks')}</div>
          <div className="text-sm">
            {t('tasks.createFirst')}
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  isExpanded={expandedTask === task.id}
                  onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onAddSubtask={onAddSubtask}
                  onUpdateTask={onUpdateTask}
                  newSubtaskTitle={newSubtaskTitle}
                  setNewSubtaskTitle={setNewSubtaskTitle}
                  t={t}
                  isDraggable={sortBy === 'manual'}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Done Section */}
      {completedTasks.length > 0 && (
        <div className="mt-6 border-t border-np-border pt-4">
          <button
            onClick={() => setShowDoneSection(!showDoneSection)}
            className="flex items-center gap-2 text-sm text-np-text-secondary hover:text-np-text-primary mb-2"
          >
            <span>{showDoneSection ? '▼' : '▶'}</span>
            <span className="text-np-green">// {t('tasks.done')}</span>
            <span className="text-xs bg-np-green/20 text-np-green px-2 py-0.5 rounded">
              {doneCount}
            </span>
          </button>

          {showDoneSection && (
            <div className="space-y-1 opacity-60">
              {completedTasks.slice(0, 10).map((task) => (
                <CompletedTaskItem
                  key={task.id}
                  task={task}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
              {completedTasks.length > 10 && (
                <div className="text-xs text-np-text-secondary text-center py-2">
                  {t('tasks.moreCompleted', { count: completedTasks.length - 10 })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
