import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates that an object is a valid Todo
 */
function isValidTodo(obj: unknown): obj is Todo {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const todo = obj as Record<string, unknown>;

  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.description === 'string' &&
    typeof todo.completed === 'boolean' &&
    (todo.createdAt instanceof Date || typeof todo.createdAt === 'string') &&
    (todo.dueDate === undefined || typeof todo.dueDate === 'string') // Optional dueDate validation
  );
}

/**
 * Validates that an array contains only valid Todo objects
 */
export function isValidTodos(data: unknown): data is Todo[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(isValidTodo);
}

/**
 * Loads todos from sessionStorage with error handling
 * Returns empty array if storage is empty, corrupt, or invalid
 */
export function loadTodos(): Todo[] {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!isValidTodos(parsed)) {
      console.warn('Invalid todos data in sessionStorage, clearing and starting fresh');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert createdAt strings back to Date objects if needed
    return parsed.map(todo => ({
      ...todo,
      createdAt: typeof todo.createdAt === 'string' ? new Date(todo.createdAt) : todo.createdAt,
      dueDate: todo.dueDate, // Ensure undefined for missing dueDate
    }));
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    // Clear corrupt data
    window.sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Saves todos to sessionStorage with error handling
 * Returns true if successful, false if quota exceeded or other error
 */
export function saveTodos(todos: Todo[]): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('SessionStorage quota exceeded - todos not saved');
        return {
          success: false,
          error: 'Storage quota exceeded – your latest changes may not be saved.',
        };
      }
      console.error('Failed to save todos to sessionStorage:', error);
      return {
        success: false,
        error: 'Failed to save changes to storage.',
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred while saving.',
    };
  }
}

/**
 * Clears todos from sessionStorage
 */
export function clearTodos(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear todos from sessionStorage:', error);
  }
}
