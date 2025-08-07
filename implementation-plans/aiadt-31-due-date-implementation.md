# Plan: Add Due Date Field to Todos (AIADT-31)

## Context

**User request**: "Add Due Date field to todos - Currently, there's sessionStorage in place, extend it for storing a new piece of data, the due date for each todo"

**Business value**: Allow users to set and view deadlines for tasks, enabling better prioritization and time-management.

**Technical context**:

- Existing Todo app with React + TypeScript + MUI components
- SessionStorage persistence already implemented in `src/utils/sessionStorage.ts`
- Current Todo interface in `src/types/Todo.ts`
- Context-based state management in `src/contexts/TodoContext.tsx`
- Modal-based create/edit flow in `src/components/TodoModal/TodoModal.tsx`
- List display in `src/components/TodoList/TodoItem.tsx`
- Comprehensive test suite in `src/__tests__/`

**Dependencies confirmed**:

- Install `@mui/x-date-pickers` and `date-fns` packages
- Wrap app with `LocalizationProvider` using `AdapterDateFns` in `App.tsx`
- Maintain test coverage ≥ existing baseline

**Acceptance criteria**:

- User can optionally pick a due date when creating a todo
- Existing todos without due date remain unaffected
- Editing a todo shows current due date and allows change or removal
- Due date shows in todo item list in locale format (e.g., Jan 31 2026)
- Validation prevents submission of clearly invalid dates
- Data persists after page refresh; legacy stored data without dueDate still loads
- All unit tests pass and coverage ≥ existing baseline

## Task List

### Task 1: Install Dependencies and Setup LocalizationProvider

**Status**: TODO  
**Depends On**: None  
**Description**:
Install required dependencies and configure the date picker infrastructure.

**Code Snippets**:

```bash
# Install required packages
npm install @mui/x-date-pickers date-fns
```

```tsx
// App.tsx - Wrap with LocalizationProvider
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* existing app content */}
    </LocalizationProvider>
  );
}
```

**Verification**:

- Dependencies are installed and appear in package.json
- App starts without errors after LocalizationProvider setup
- No TypeScript compilation errors

### Task 2: Extend Todo Interface with Due Date

**Status**: TODO  
**Depends On**: None  
**Description**:
Add optional `dueDate` field to the Todo interface using ISO 8601 string format for storage compatibility.

**Code Snippets**:

```typescript
// src/types/Todo.ts
export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: string; // ISO 8601 format for storage compatibility
}
```

**Verification**:

- Todo interface includes optional dueDate field
- TypeScript compilation succeeds
- Existing code continues to work (backward compatibility)

### Task 3: Update SessionStorage Utils for Due Date Persistence

**Status**: TODO  
**Depends On**: [2]  
**Description**:
Modify storage validation and serialization to handle the new dueDate field gracefully, ensuring backward compatibility with existing stored data.

**Code Snippets**:

```typescript
// src/utils/sessionStorage.ts - Update validation
function isValidTodo(obj: unknown): obj is Todo {
  // ... existing validation ...
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.description === 'string' &&
    typeof todo.completed === 'boolean' &&
    (todo.createdAt instanceof Date || typeof todo.createdAt === 'string') &&
    (todo.dueDate === undefined || typeof todo.dueDate === 'string') // Optional dueDate validation
  );
}

// Handle legacy data without dueDate in loadTodos
return parsed.map(todo => ({
  ...todo,
  createdAt: typeof todo.createdAt === 'string' ? new Date(todo.createdAt) : todo.createdAt,
  dueDate: todo.dueDate || undefined, // Ensure undefined for missing dueDate
}));
```

**Verification**:

- Legacy todos without dueDate load correctly
- New todos with dueDate persist and load correctly
- Invalid dueDate values are handled gracefully
- Storage validation includes dueDate field

### Task 4: Update TodoContext for Due Date Operations

**Status**: TODO  
**Depends On**: [2]  
**Description**:
Modify `addTodo` and `editTodo` functions to accept and handle the optional dueDate parameter.

**Code Snippets**:

```typescript
// src/contexts/TodoContext.tsx
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
```

**Verification**:

- addTodo accepts optional dueDate parameter
- editTodo can update dueDate field
- Context functions work with both legacy and new todo formats
- No breaking changes to existing functionality

### Task 5: Add DatePicker to TodoModal

**Status**: TODO  
**Depends On**: [1, 4]  
**Description**:
Integrate MUI DatePicker component into the create/edit modal, allowing users to select, modify, or clear due dates.

**Code Snippets**:

```tsx
// src/components/TodoModal/TodoModal.tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

const [dueDate, setDueDate] = useState<Date | null>(null);

// In useEffect for initial values
useEffect(() => {
  if (isOpen) {
    if (mode === 'edit' && initialValues) {
      // ... existing state updates ...
      setDueDate(initialValues.dueDate ? new Date(initialValues.dueDate) : null);
    } else {
      // ... existing resets ...
      setDueDate(null);
    }
  }
}, [isOpen, mode, initialValues]);

// In handleSubmit
const dueDateISO = dueDate ? dueDate.toISOString() : undefined;

if (mode === 'create') {
  addTodo(title.trim(), description.trim(), dueDateISO);
} else if (mode === 'edit' && initialValues) {
  editTodo(initialValues.id, {
    title: title.trim(),
    description: description.trim(),
    completed,
    dueDate: dueDateISO,
  });
}

// In JSX
<DatePicker
  label="Due Date"
  value={dueDate}
  onChange={newValue => setDueDate(newValue)}
  slotProps={{
    textField: {
      fullWidth: true,
      margin: 'normal',
    },
  }}
/>;
```

**Verification**:

- DatePicker appears in both create and edit modes
- Date selection updates state correctly
- Clearing date sets value to null/undefined
- Form submission includes dueDate in correct ISO format
- Modal handles both legacy todos (no dueDate) and new todos

### Task 6: Display Due Date in TodoItem

**Status**: TODO  
**Depends On**: [2, 3]  
**Description**:
Show formatted due date in the todo list with visual indication for overdue items using red text color.

**Code Snippets**:

```tsx
// src/components/TodoList/TodoItem.tsx
import { format, isBefore, startOfDay } from 'date-fns';
import { Typography, Box } from '@mui/material';

const TodoItem: React.FC<TodoItemProps> = ({ todo, onEditClick }) => {
  const isOverdue = todo.dueDate && isBefore(new Date(todo.dueDate), startOfDay(new Date()));

  return (
    <ListItem>
      {/* ... existing content ... */}
      <ListItemText
        primary={
          <Box>
            <Typography variant="body1" /* ... existing props ... */>{todo.title}</Typography>
            {todo.dueDate && (
              <Typography
                variant="body2"
                color={isOverdue ? 'error.main' : 'text.secondary'}
                sx={{ mt: 0.5 }}
              >
                Due: {format(new Date(todo.dueDate), 'PP')}
              </Typography>
            )}
          </Box>
        }
        secondary={todo.description}
      />
    </ListItem>
  );
};
```

**Verification**:

- Due date displays in locale-friendly format (e.g., "Jan 31, 2026")
- Overdue items show due date in red color
- Todos without due date display normally
- Date formatting handles various date inputs correctly

### Task 7: Add Form Validation for Due Date

**Status**: TODO  
**Depends On**: [5]  
**Description**:
Implement basic validation to prevent submission of clearly invalid dates while allowing past dates as per requirements.

**Code Snippets**:

```tsx
// src/components/TodoModal/TodoModal.tsx
const [dueDateError, setDueDateError] = useState('');

const validateForm = () => {
  let isValid = true;

  // ... existing title validation ...

  // Basic date validation
  if (dueDate && isNaN(dueDate.getTime())) {
    setDueDateError('Please enter a valid date');
    isValid = false;
  } else {
    setDueDateError('');
  }

  return isValid;
};

// In JSX
<DatePicker
  label="Due Date"
  value={dueDate}
  onChange={newValue => {
    setDueDate(newValue);
    if (dueDateError && newValue && !isNaN(newValue.getTime())) {
      setDueDateError('');
    }
  }}
  slotProps={{
    textField: {
      fullWidth: true,
      margin: 'normal',
      error: !!dueDateError,
      helperText: dueDateError,
    },
  }}
/>;
```

**Verification**:

- Invalid dates show error message
- Valid dates (including past dates) are accepted
- Error clears when valid date is selected
- Form submission prevented when date is invalid

### Task 8: Update Unit Tests for Due Date Functionality

**Status**: TODO  
**Depends On**: [3, 4, 5, 6]  
**Description**:
Update existing tests and add new tests to cover due date functionality across all modified components.

**Code Snippets**:

```typescript
// src/__tests__/TodoContext.test.tsx - Update mock data
const mockTodoWithDueDate: Todo = {
  id: '1',
  title: 'Test Todo',
  description: 'Test Description',
  completed: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  dueDate: '2024-12-31T00:00:00.000Z',
};

// Add test for addTodo with dueDate
it('can add a todo with due date', async () => {
  // ... test implementation
});

// src/__tests__/sessionStorage.test.tsx - Update validation tests
it('returns true for todos with optional dueDate', () => {
  const todosWithDueDate = [{ ...mockTodo, dueDate: '2024-12-31T00:00:00.000Z' }];
  const todosWithoutDueDate = [mockTodo]; // No dueDate field

  expect(isValidTodos(todosWithDueDate)).toBe(true);
  expect(isValidTodos(todosWithoutDueDate)).toBe(true);
});

// src/__tests__/TodoModal.test.tsx - Add DatePicker tests
it('renders date picker in create mode', () => {
  // ... test implementation
});

it('shows existing due date in edit mode', () => {
  // ... test implementation
});
```

**Verification**:

- All existing tests continue to pass
- New tests cover dueDate functionality
- Test coverage meets or exceeds baseline
- Tests cover both legacy data (no dueDate) and new data scenarios

### Task 9: Manual Testing and QA

**Status**: TODO  
**Depends On**: [1, 2, 3, 4, 5, 6, 7, 8]  
**Description**:
Perform comprehensive manual testing to ensure all acceptance criteria are met and edge cases are handled.

**Verification**:

- Create todo with due date - date persists after page refresh
- Create todo without due date - functions normally
- Edit existing todo to add due date - saves correctly
- Edit existing todo to remove due date - clears correctly
- Legacy todos (created before feature) load and function normally
- Due dates display in correct locale format
- Overdue todos show red date text
- Invalid dates show validation errors
- Past dates are accepted (per requirements)
- All tests pass: `npm test`
- App builds successfully: `npm run build`
- No console errors during normal operation

## Execution Guide

1. Pick the next task that is not in progress and has all dependencies marked as DONE.
   If multiple tasks are eligible, pick the first one in the list.

2. Execute the selected task:
   a. Set status to IN-PROGRESS
   b. Follow the task description and code snippets
   c. Complete verification steps
   d. Set status to DONE when verified successfully

3. Continue to the next eligible task until all tasks are completed.

## Technical Notes

- **Date Storage Format**: Use ISO 8601 strings for storage compatibility and timezone handling
- **Display Format**: Use date-fns `format(date, 'PP')` for locale-friendly display
- **Backward Compatibility**: All existing todos without dueDate continue to work unchanged
- **Validation**: Allow past dates but prevent clearly invalid dates
- **Visual Indicators**: Use MUI theme colors (`error.main`) for overdue indication
- **Error Handling**: Follow existing patterns with toast notifications for storage errors

## Rollback Plan

If issues arise during implementation:

1. Revert changes to TodoContext and storage utilities
2. Remove DatePicker from TodoModal
3. Remove due date display from TodoItem
4. Uninstall new dependencies if needed
5. All existing functionality will continue to work with legacy data

## Estimated Timeline

- Tasks 1-2: 1 hour (setup and types)
- Tasks 3-4: 2 hours (storage and context)
- Tasks 5-6: 2 hours (UI components)
- Task 7: 1 hour (validation)
- Task 8: 2 hours (testing)
- Task 9: 1 hour (QA)

**Total**: 9 hours development + testing
