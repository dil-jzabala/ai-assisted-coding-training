import { createContext } from 'react';
import type { AlertColor } from '@mui/material';

export interface ToastContextType {
  showToast: (message: string, severity?: AlertColor, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
