import { useState, useEffect } from 'react'
import { useTaskStore, getFilteredTasks } from '../../stores/taskStore'
import { ConfirmModal } from '../common'
import { useTranslation } from '../../i18n'
import type { Task } from '../../types'
import { TaskFilters } from './TaskFilters'
import { NewTaskForm, EditTaskModal } from './TaskForm'
import { TaskList } from './TaskList'

export function TasksModule() {
  const { t } = useTranslation()
  const store = useTaskStore()
  const { addTask, deleteTask, toggleTask, updateTask, addSubtask, toggleSubtask, deleteSubtask, filter, setFilter, sortBy, setSortBy, reorderTasks } = store
  const allTasks = store.tasks
  const filteredTasks = getFilteredTasks(store)

  // Separate active and completed tasks
  const activeTasks = filteredTasks.filter(t => !t.completed)
  const completedTasks = allTasks.filter(t => t.completed).sort((a, b) =>
    new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  )

  // UI State
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'P2' as Task['priority'],
    description: '',
    startDate: '',
    startTime: '',
    deadline: '',
    deadlineTime: '',
    reminderEnabled: false,
    reminderMinutesBefore: 30,
    linkedBookmarkIds: [] as string[]
  })
  const [newTaskBookmarkSearch, setNewTaskBookmarkSearch] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showDoneSection, setShowDoneSection] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null; title: string }>({
    isOpen: false,
    taskId: null,
    title: ''
  })
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskForm, setEditTaskForm] = useState<{
    title: string
    priority: Task['priority']
    description: string
    startDate: string
    startTime: string
    deadline: string
    deadlineTime: string
    reminderEnabled: boolean
    reminderMinutesBefore: number
    tags: string[]
    newTag: string
    linkedBookmarkIds: string[]
  } | null>(null)
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('')

  // Auto-complete parent task when all subtasks are done
  useEffect(() => {
    allTasks.forEach(task => {
      if (!task.completed && task.subtasks.length > 0) {
        const allSubtasksDone = task.subtasks.every(s => s.completed)
        if (allSubtasksDone) {
          toggleTask(task.id)
        }
      }
    })
  }, [allTasks, toggleTask])

  // Handlers
  const handleAdd = () => {
    if (!newTask.title.trim()) return
    addTask({
      title: newTask.title,
      priority: newTask.priority,
      description: newTask.description,
      startDate: newTask.startDate ? new Date(newTask.startDate) : undefined,
      startTime: newTask.startTime || undefined,
      deadline: newTask.deadline ? new Date(newTask.deadline) : undefined,
      deadlineTime: newTask.deadlineTime || undefined,
      reminderEnabled: newTask.reminderEnabled,
      reminderMinutesBefore: newTask.reminderMinutesBefore,
      linkedBookmarkIds: newTask.linkedBookmarkIds,
    })
    setNewTask({ title: '', priority: 'P2', description: '', startDate: '', startTime: '', deadline: '', deadlineTime: '', reminderEnabled: false, reminderMinutesBefore: 30, linkedBookmarkIds: [] })
    setNewTaskBookmarkSearch('')
    setShowForm(false)
  }

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return
    addSubtask(taskId, newSubtaskTitle.trim())
    setNewSubtaskTitle('')
  }

  const handleDeleteTask = (taskId: string, title: string) => {
    setDeleteConfirm({ isOpen: true, taskId, title })
  }

  const confirmDeleteTask = () => {
    if (deleteConfirm.taskId) {
      deleteTask(deleteConfirm.taskId)
    }
    setDeleteConfirm({ isOpen: false, taskId: null, title: '' })
  }

  const openEditTaskModal = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    setEditingTaskId(taskId)
    setEditTaskForm({
      title: task.title,
      priority: task.priority,
      description: task.description || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      startTime: task.startTime || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      deadlineTime: task.deadlineTime || '',
      reminderEnabled: task.reminderEnabled || false,
      reminderMinutesBefore: task.reminderMinutesBefore || 30,
      tags: task.tags || [],
      newTag: '',
      linkedBookmarkIds: task.linkedBookmarkIds || []
    })
  }

  const handleSaveTaskEdit = () => {
    if (!editingTaskId || !editTaskForm) return
    updateTask(editingTaskId, {
      title: editTaskForm.title,
      priority: editTaskForm.priority,
      description: editTaskForm.description || undefined,
      startDate: editTaskForm.startDate ? new Date(editTaskForm.startDate) : undefined,
      startTime: editTaskForm.startTime || undefined,
      deadline: editTaskForm.deadline ? new Date(editTaskForm.deadline) : undefined,
      deadlineTime: editTaskForm.deadlineTime || undefined,
      reminderEnabled: editTaskForm.reminderEnabled,
      reminderMinutesBefore: editTaskForm.reminderMinutesBefore,
      tags: editTaskForm.tags,
      linkedBookmarkIds: editTaskForm.linkedBookmarkIds
    })
    setEditingTaskId(null)
    setEditTaskForm(null)
  }

  const handleCancelTaskEdit = () => {
    setEditingTaskId(null)
    setEditTaskForm(null)
  }

  const pendingCount = activeTasks.length

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-green">// </span>{t('tasks.title')}
          </h2>
          <p className="text-sm text-np-text-secondary mt-1">
            {pendingCount === 1
              ? t('tasks.pendingCount', { count: pendingCount })
              : t('tasks.pendingCountPlural', { count: pendingCount })}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="np-btn">
          <span className="text-np-green">+</span> {t('tasks.newTask')}
        </button>
      </div>

      {/* Filters */}
      <TaskFilters
        filter={filter}
        sortBy={sortBy}
        onFilterChange={setFilter}
        onSortChange={setSortBy}
        t={t}
      />

      {/* New task form */}
      {showForm && (
        <NewTaskForm
          newTask={newTask}
          setNewTask={setNewTask}
          bookmarkSearchQuery={newTaskBookmarkSearch}
          setBookmarkSearchQuery={setNewTaskBookmarkSearch}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          t={t}
        />
      )}

      {/* Task List */}
      <TaskList
        activeTasks={activeTasks}
        completedTasks={completedTasks}
        expandedTask={expandedTask}
        setExpandedTask={setExpandedTask}
        newSubtaskTitle={newSubtaskTitle}
        setNewSubtaskTitle={setNewSubtaskTitle}
        showDoneSection={showDoneSection}
        setShowDoneSection={setShowDoneSection}
        sortBy={sortBy}
        filter={filter}
        onToggleTask={toggleTask}
        onEditTask={openEditTaskModal}
        onDeleteTask={handleDeleteTask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
        onAddSubtask={handleAddSubtask}
        onUpdateTask={updateTask}
        onReorderTasks={reorderTasks}
        t={t}
      />

      {/* Edit Task Modal */}
      {editingTaskId && editTaskForm && (
        <EditTaskModal
          editTaskForm={editTaskForm}
          setEditTaskForm={setEditTaskForm}
          bookmarkSearchQuery={bookmarkSearchQuery}
          setBookmarkSearchQuery={setBookmarkSearchQuery}
          onSave={handleSaveTaskEdit}
          onCancel={handleCancelTaskEdit}
          t={t}
        />
      )}

      {/* Keyboard hints */}
      <div className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary">
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Click</kbd> {t('tasks.clickExpand')}</span>
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> {t('tasks.enterAddSubtask')}</span>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={`// ${t('confirm.deleteTask')}`}
        message={`${t('confirm.deleteTaskMessage', { title: deleteConfirm.title })}\n\n${t('confirm.subtasksWarning')}`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null, title: '' })}
      />
    </div>
  )
}
