/**
 * IPC Store Service
 * Handles store access requests from Electron main process (MCP Server)
 */

import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useHabitStore } from '../stores/habitStore';
import { useJournalStore } from '../stores/journalStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useIdeaStore } from '../stores/ideaStore';
import { useDailyNotesStore } from '../stores/dailyNotesStore';
import { useFocusStore } from '../stores/focusStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useSettingsStore } from '../stores/settingsStore';

type StoreName =
  | 'notes'
  | 'tasks'
  | 'habits'
  | 'journal'
  | 'bookmarks'
  | 'ideas'
  | 'dailyNotes'
  | 'focus'
  | 'gamification'
  | 'settings';

// Store accessors
const storeAccessors: Record<StoreName, {
  getAll: () => unknown[];
  getById: (id: string) => unknown | null;
  create: (data: unknown) => unknown;
  update: (id: string, data: unknown) => unknown;
  delete: (id: string) => boolean;
  search?: (query: string) => unknown[];
  getState: () => unknown;
}> = {
  notes: {
    getAll: () => useNoteStore.getState().notes,
    getById: (id) => useNoteStore.getState().notes.find(n => n.id === id) || null,
    create: (data) => {
      // addNote returns the new note's id and adds to beginning of array
      const id = useNoteStore.getState().addNote(data as { title: string; content?: string; tags?: string[] });
      // Get fresh state and find the note by id
      return useNoteStore.getState().notes.find(n => n.id === id) || null;
    },
    update: (id, data) => {
      useNoteStore.getState().updateNote(id, data as Partial<{ title: string; content: string; tags: string[] }>);
      return useNoteStore.getState().notes.find(n => n.id === id);
    },
    delete: (id) => {
      useNoteStore.getState().deleteNote(id);
      return true;
    },
    search: (query) => {
      const notes = useNoteStore.getState().notes;
      const q = query.toLowerCase();
      return notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    },
    getState: () => useNoteStore.getState(),
  },

  tasks: {
    getAll: () => useTaskStore.getState().tasks,
    getById: (id) => useTaskStore.getState().tasks.find(t => t.id === id) || null,
    create: (data) => {
      // addTask returns the new task's id
      const id = useTaskStore.getState().addTask(data as { title: string; priority?: string; deadline?: string });
      // Get fresh state and find the task by id
      return useTaskStore.getState().tasks.find(t => t.id === id) || null;
    },
    update: (id, data) => {
      useTaskStore.getState().updateTask(id, data as Partial<{ title: string; completed: boolean }>);
      return useTaskStore.getState().tasks.find(t => t.id === id);
    },
    delete: (id) => {
      useTaskStore.getState().deleteTask(id);
      return true;
    },
    search: (query) => {
      const tasks = useTaskStore.getState().tasks;
      const q = query.toLowerCase();
      return tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q))
      );
    },
    getState: () => useTaskStore.getState(),
  },

  habits: {
    getAll: () => useHabitStore.getState().habits,
    getById: (id) => useHabitStore.getState().habits.find(h => h.id === id) || null,
    create: (data) => {
      // addHabit returns the new habit's id
      const id = useHabitStore.getState().addHabit(data as { name: string; frequency?: string; category?: string });
      // Get fresh state and find the habit by id
      return useHabitStore.getState().habits.find(h => h.id === id) || null;
    },
    update: (id, data) => {
      useHabitStore.getState().updateHabit(id, data as Partial<{ name: string }>);
      return useHabitStore.getState().habits.find(h => h.id === id);
    },
    delete: (id) => {
      useHabitStore.getState().deleteHabit(id);
      return true;
    },
    getState: () => useHabitStore.getState(),
  },

  journal: {
    getAll: () => useJournalStore.getState().entries,
    getById: (id) => useJournalStore.getState().entries.find(e => e.id === id || e.date === id) || null,
    create: (data) => {
      const store = useJournalStore.getState();
      const entry = data as { date: string; content?: string; mood?: number; energy?: number };
      store.updateEntry(entry.date, entry);
      return store.entries.find(e => e.date === entry.date);
    },
    update: (id, data) => {
      const store = useJournalStore.getState();
      const entry = store.entries.find(e => e.id === id || e.date === id);
      if (entry) {
        store.updateEntry(entry.date, data as Partial<{ content: string; mood: number; energy: number }>);
      }
      return store.entries.find(e => e.id === id || e.date === id);
    },
    delete: (id) => {
      // Journal entries are typically not deleted
      return false;
    },
    getState: () => useJournalStore.getState(),
  },

  bookmarks: {
    getAll: () => useBookmarkStore.getState().bookmarks,
    getById: (id) => useBookmarkStore.getState().bookmarks.find(b => b.id === id) || null,
    create: (data) => {
      // addBookmark returns the new bookmark's id
      const id = useBookmarkStore.getState().addBookmark(data as { url: string; title: string; tags?: string[] });
      // Get fresh state and find the bookmark by id
      return useBookmarkStore.getState().bookmarks.find(b => b.id === id) || null;
    },
    update: (id, data) => {
      useBookmarkStore.getState().updateBookmark(id, data as Partial<{ title: string; tags: string[] }>);
      return useBookmarkStore.getState().bookmarks.find(b => b.id === id);
    },
    delete: (id) => {
      useBookmarkStore.getState().deleteBookmark(id);
      return true;
    },
    search: (query) => {
      const bookmarks = useBookmarkStore.getState().bookmarks;
      const q = query.toLowerCase();
      return bookmarks.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    },
    getState: () => useBookmarkStore.getState(),
  },

  ideas: {
    getAll: () => useIdeaStore.getState().ideas,
    getById: (id) => useIdeaStore.getState().ideas.find(i => i.id === id) || null,
    create: (data) => {
      // addIdea returns the new idea's id
      const id = useIdeaStore.getState().addIdea(data as { title: string; content?: string; color?: string });
      // Get fresh state and find the idea by id
      return useIdeaStore.getState().ideas.find(i => i.id === id) || null;
    },
    update: (id, data) => {
      useIdeaStore.getState().updateIdea(id, data as Partial<{ title: string; content: string }>);
      return useIdeaStore.getState().ideas.find(i => i.id === id);
    },
    delete: (id) => {
      useIdeaStore.getState().deleteIdea(id);
      return true;
    },
    getState: () => useIdeaStore.getState(),
  },

  dailyNotes: {
    getAll: () => useDailyNotesStore.getState().dailyNotes,
    getById: (id) => useDailyNotesStore.getState().dailyNotes.find(d => d.id === id || d.date === id) || null,
    create: (data) => {
      // Daily notes are created per-date with cards
      return null;
    },
    update: (id, data) => {
      return null;
    },
    delete: (id) => {
      return false;
    },
    getState: () => useDailyNotesStore.getState(),
  },

  focus: {
    getAll: () => useFocusStore.getState().sessions,
    getById: (id) => useFocusStore.getState().sessions.find(s => s.id === id) || null,
    create: (data) => null, // Sessions are created via focus mode
    update: (id, data) => null,
    delete: (id) => false,
    getState: () => useFocusStore.getState(),
  },

  gamification: {
    getAll: () => [useGamificationStore.getState()],
    getById: () => useGamificationStore.getState(),
    create: () => null,
    update: () => null,
    delete: () => false,
    getState: () => useGamificationStore.getState(),
  },

  settings: {
    getAll: () => [useSettingsStore.getState()],
    getById: () => useSettingsStore.getState(),
    create: () => null,
    update: (_, data) => {
      const store = useSettingsStore.getState();
      Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
        if (key in store && typeof (store as Record<string, unknown>)[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] === 'function') {
          // Try to call setter
        }
      });
      return store;
    },
    delete: () => false,
    getState: () => useSettingsStore.getState(),
  },
};

// Action executors for specific store actions
const actionExecutors: Record<string, Record<string, (...args: unknown[]) => unknown>> = {
  tasks: {
    toggleComplete: (id: string) => useTaskStore.getState().toggleComplete(id),
    addSubtask: (taskId: string, title: string) => useTaskStore.getState().addSubtask(taskId, title),
    toggleSubtask: (taskId: string, subtaskId: string) => useTaskStore.getState().toggleSubtask(taskId, subtaskId),
    archiveTask: (id: string) => useTaskStore.getState().archiveTask(id),
  },
  habits: {
    toggleCompletion: (id: string, date?: string) => useHabitStore.getState().toggleCompletion(id, date),
  },
  focus: {
    startSession: (taskId?: string) => useFocusStore.getState().startSession(taskId),
    pauseSession: () => useFocusStore.getState().pauseSession(),
    resumeSession: () => useFocusStore.getState().resumeSession(),
    endSession: () => useFocusStore.getState().endSession(),
  },
  gamification: {
    addXP: (amount: number, reason: string) => useGamificationStore.getState().addXP(amount, reason),
  },
  ideas: {
    convertToNote: (id: string) => useIdeaStore.getState().convertToNote(id),
    convertToTask: (id: string) => useIdeaStore.getState().convertToTask(id),
    archiveIdea: (id: string) => useIdeaStore.getState().archiveIdea(id),
  },
};

// Initialize IPC listeners
export function initializeIpcStoreService() {
  if (!window.electronAPI) {
    console.log('[IPC Store] Not in Electron environment');
    return;
  }

  const { storeBridge } = window.electronAPI as { storeBridge?: {
    onStoreRequest: (handler: (channel: string, requestId: string, ...args: unknown[]) => void) => void;
    sendResponse: (requestId: string, data: unknown, error?: string) => void;
    notifyChange: (storeName: string, action: string, data: unknown) => void;
  }};

  if (!storeBridge) {
    console.log('[IPC Store] Store bridge not available in preload');
    return;
  }

  console.log('[IPC Store] Initializing store bridge via preload...');

  // Handle all store requests from main process
  storeBridge.onStoreRequest((channel, requestId, ...args) => {
    try {
      const [storeName, ...restArgs] = args as [StoreName, ...unknown[]];
      const accessor = storeAccessors[storeName];

      if (!accessor) {
        storeBridge.sendResponse(requestId, null, `Unknown store: ${storeName}`);
        return;
      }

      let result: unknown;

      switch (channel) {
        case 'store:getAll':
          result = accessor.getAll();
          break;
        case 'store:getById':
          result = accessor.getById(restArgs[0] as string);
          break;
        case 'store:create':
          result = accessor.create(restArgs[0]);
          storeBridge.notifyChange(storeName, 'created', result);
          break;
        case 'store:update':
          result = accessor.update(restArgs[0] as string, restArgs[1]);
          storeBridge.notifyChange(storeName, 'updated', result);
          break;
        case 'store:delete':
          result = accessor.delete(restArgs[0] as string);
          storeBridge.notifyChange(storeName, 'deleted', { id: restArgs[0] });
          break;
        case 'store:search':
          result = accessor.search?.(restArgs[0] as string) || [];
          break;
        case 'store:action': {
          const [actionName, ...actionArgs] = restArgs as [string, ...unknown[]];
          const executor = actionExecutors[storeName]?.[actionName];
          if (!executor) {
            storeBridge.sendResponse(requestId, null, `Unknown action: ${storeName}.${actionName}`);
            return;
          }
          result = executor(...actionArgs);
          storeBridge.notifyChange(storeName, actionName, { args: actionArgs, result });
          break;
        }
        case 'store:getState':
          result = accessor.getState();
          break;
        default:
          storeBridge.sendResponse(requestId, null, `Unknown channel: ${channel}`);
          return;
      }

      storeBridge.sendResponse(requestId, result);
    } catch (error) {
      storeBridge.sendResponse(requestId, null, (error as Error).message);
    }
  });

  console.log('[IPC Store] Store bridge initialized');
}
