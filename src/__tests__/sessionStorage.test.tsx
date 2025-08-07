import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, isValidTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Replace global sessionStorage with mock
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

const mockTodo: Todo = {
  id: '1',
  title: 'Test Todo',
  description: 'Test Description',
  completed: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const mockTodos: Todo[] = [
  mockTodo,
  {
    id: '2',
    title: 'Another Todo',
    description: 'Another Description',
    completed: true,
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
  },
];

describe('sessionStorage utils', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('isValidTodos', () => {
    it('returns true for valid todo array', () => {
      expect(isValidTodos(mockTodos)).toBe(true);
    });

    it('returns false for non-array', () => {
      expect(isValidTodos('not an array')).toBe(false);
      expect(isValidTodos({})).toBe(false);
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
    });

    it('returns false for array with invalid todo objects', () => {
      const invalidTodos = [
        { id: 1, title: 'Test', description: 'Test', completed: false }, // id should be string
        { title: 'Test', description: 'Test', completed: false }, // missing id
        { id: '1', description: 'Test', completed: false }, // missing title
        { id: '1', title: 'Test', completed: false }, // missing description
        { id: '1', title: 'Test', description: 'Test' }, // missing completed
      ];

      invalidTodos.forEach(invalidTodo => {
        expect(isValidTodos([invalidTodo])).toBe(false);
      });
    });

    it('returns true for todos with Date or string createdAt', () => {
      const todosWithDate = [{ ...mockTodo, createdAt: new Date() }];
      const todosWithString = [{ ...mockTodo, createdAt: '2024-01-01T00:00:00.000Z' }];

      expect(isValidTodos(todosWithDate)).toBe(true);
      expect(isValidTodos(todosWithString)).toBe(true);
    });

    it('returns true for todos with optional dueDate', () => {
      const todosWithDueDate = [{ ...mockTodo, dueDate: '2024-12-31T00:00:00.000Z' }];
      const todosWithoutDueDate = [mockTodo]; // No dueDate field
      const todosWithUndefinedDueDate = [{ ...mockTodo, dueDate: undefined }];

      expect(isValidTodos(todosWithDueDate)).toBe(true);
      expect(isValidTodos(todosWithoutDueDate)).toBe(true);
      expect(isValidTodos(todosWithUndefinedDueDate)).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('returns empty array when storage is empty', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('todos');
    });

    it('loads and parses valid todos from storage', () => {
      const storedData = JSON.stringify(mockTodos);
      mockSessionStorage.getItem.mockReturnValue(storedData);

      const result = loadTodos();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Test Todo');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('converts string createdAt to Date objects', () => {
      const todosWithStringDates = mockTodos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt.toISOString(),
      }));

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(todosWithStringDates));

      const result = loadTodos();

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
    });

    it('handles corrupt JSON data gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load todos from sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles invalid todo data gracefully', () => {
      const invalidData = JSON.stringify([{ invalid: 'todo' }]);
      mockSessionStorage.getItem.mockReturnValue(invalidData);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid todos data in sessionStorage, clearing and starting fresh'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveTodos', () => {
    it('successfully saves todos to storage', () => {
      const result = saveTodos(mockTodos);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('todos', JSON.stringify(mockTodos));
    });

    it('handles QuotaExceededError gracefully', () => {
      const error = new Error('Quota exceeded');
      error.name = 'QuotaExceededError';
      mockSessionStorage.setItem.mockImplementation(() => {
        throw error;
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(mockTodos);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage quota exceeded – your latest changes may not be saved.');
      expect(consoleSpy).toHaveBeenCalledWith('SessionStorage quota exceeded - todos not saved');

      consoleSpy.mockRestore();
    });

    it('handles other errors gracefully', () => {
      const error = new Error('Some other error');
      mockSessionStorage.setItem.mockImplementation(() => {
        throw error;
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = saveTodos(mockTodos);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save changes to storage.');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save todos to sessionStorage:', error);

      consoleSpy.mockRestore();
    });

    it('handles unknown error types', () => {
      mockSessionStorage.setItem.mockImplementation(() => {
        throw 'string error'; // Non-Error object
      });

      const result = saveTodos(mockTodos);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred while saving.');
    });
  });
});
