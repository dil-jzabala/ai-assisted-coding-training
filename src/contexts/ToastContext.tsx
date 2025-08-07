import React, { useState } from 'react';
import type { AlertColor } from '@mui/material';
import { Toast } from '../components/Toast/Toast';
import { ToastContext } from './ToastContextType';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 6000,
  });

  const showToast = (message: string, severity: AlertColor = 'info', duration: number = 6000) => {
    setToast({
      open: true,
      message,
      severity,
      duration,
    });
  };

  const handleClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        duration={toast.duration}
        onClose={handleClose}
      />
    </ToastContext.Provider>
  );
};
