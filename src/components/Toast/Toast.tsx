import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

export interface ToastProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  severity = 'info',
  duration = 6000,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};
