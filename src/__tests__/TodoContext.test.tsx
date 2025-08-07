import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import { ToastProvider } from '../contexts/ToastContext';
import { useTodo } from '../hooks/useTodo';
import { vi, beforeEach } from 'vitest';
// import { act } from 'react-dom/test-utils';

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

const TestComponent = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo } = useTodo();

  return (
    <div>
      <button data-testid="add-todo" onClick={() => addTodo('Test Todo', 'Test Description')}>
        Add Todo
      </button>
      <button
        data-testid="add-todo-with-date"
        onClick={() => addTodo('Todo with Date', 'Test Description', '2024-12-31T00:00:00.000Z')}
      >
        Add Todo with Date
      </button>
      <div data-testid="todo-count">{todos.length}</div>
      {todos.map(todo => (
        <div key={todo.id} data-testid={`todo-item-${todo.id}`}>
          <span data-testid={`todo-title-${todo.id}`}>{todo.title}</span>
          <span data-testid={`todo-desc-${todo.id}`}>{todo.description}</span>
          <span data-testid={`todo-completed-${todo.id}`}>
            {todo.completed ? 'Completed' : 'Not completed'}
          </span>
          <button data-testid={`toggle-${todo.id}`} onClick={() => toggleTodoCompletion(todo.id)}>
            Toggle
          </button>
          <button data-testid={`delete-${todo.id}`} onClick={() => deleteTodo(todo.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      <TodoProvider>{component}</TodoProvider>
    </ToastProvider>
  );
};

describe('TodoContext', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  it('provides empty todos array initially', () => {
    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todo-count').textContent).toBe('0');
  });

  it('can add a new todo', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByTestId('add-todo'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Test Todo')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('can toggle todo completion status', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByTestId('add-todo'));

    const todoId =
      screen.getByTestId('todo-count').textContent === '1'
        ? screen
            .getByText('Test Todo')
            .closest('[data-testid^="todo-item-"]')
            ?.getAttribute('data-testid')
            ?.replace('todo-item-', '')
        : '';

    expect(screen.getByTestId(`todo-completed-${todoId}`).textContent).toBe('Not completed');

    await user.click(screen.getByTestId(`toggle-${todoId}`));

    expect(screen.getByTestId(`todo-completed-${todoId}`).textContent).toBe('Completed');
  });

  it('can delete a todo', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByTestId('add-todo'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');

    const todoId =
      screen.getByTestId('todo-count').textContent === '1'
        ? screen
            .getByText('Test Todo')
            .closest('[data-testid^="todo-item-"]')
            ?.getAttribute('data-testid')
            ?.replace('todo-item-', '')
        : '';

    await user.click(screen.getByTestId(`delete-${todoId}`));

    expect(screen.getByTestId('todo-count').textContent).toBe('0');
  });

  it('can add a todo with due date', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByTestId('add-todo-with-date'));

    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Todo with Date')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('hydrates todos from sessionStorage on mount', () => {
    const storedTodos = [
      {
        id: '1',
        title: 'Stored Todo',
        description: 'Stored Description',
        completed: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(storedTodos));

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todo-count').textContent).toBe('1');
    expect(screen.getByText('Stored Todo')).toBeInTheDocument();
    expect(screen.getByText('Stored Description')).toBeInTheDocument();
  });

  it('persists todos to sessionStorage when state changes', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TestComponent />);

    await user.click(screen.getByTestId('add-todo'));

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'todos',
      expect.stringContaining('Test Todo')
    );
  });

  it('handles corrupt sessionStorage data gracefully', () => {
    mockSessionStorage.getItem.mockReturnValue('invalid json');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todo-count').textContent).toBe('0');
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('todos');

    consoleSpy.mockRestore();
  });
});
