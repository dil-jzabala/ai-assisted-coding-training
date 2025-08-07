import React, { useState, useEffect, useRef } from 'react';
import type { Todo } from '../types/Todo';
import { v4 as uuidv4 } from 'uuid';
import { TodoContext } from './TodoContextType';
import { loadTodos, saveTodos } from '../utils/sessionStorage';
import { useToast } from '../hooks/useToast';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const { showToast } = useToast();
  const isInitialRender = useRef(true);

  // Hydrate todos from sessionStorage on mount
  useEffect(() => {
    const storedTodos = loadTodos();
    if (storedTodos.length > 0) {
      setTodos(storedTodos);
    }
  }, []);

  // Persist todos to sessionStorage whenever todos change
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      // Skip saving on initial render if todos is empty
      if (todos.length === 0) return;
    }

    const result = saveTodos(todos);
    if (!result.success && result.error) {
      showToast(result.error, 'warning');
    }
  }, [todos, showToast]);

  const addTodo = (title: string, description: string, dueDate?: string) => {
    const newTodo: Todo = {
      id: uuidv4(),
      title,
      description,
      completed: false,
      createdAt: new Date(),
      dueDate, // Include optional dueDate
    };
    setTodos([...todos, newTodo]);
  };

  const editTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const toggleTodoCompletion = (id: string) => {
    setTodos(todos.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <TodoContext.Provider value={{ todos, addTodo, editTodo, toggleTodoCompletion, deleteTodo }}>
      {children}
    </TodoContext.Provider>
  );
};

// No re-exports to avoid react-refresh/only-export-components error
