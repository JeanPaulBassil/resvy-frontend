import React, { createContext, useContext, ReactNode } from 'react';
import { addToast } from '@heroui/react';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

export const useToast = () => useContext(ToastContext);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const success = (message: string) => {
    addToast({
      title: 'Success',
      description: message,
      color: 'success',
      timeout: 3000,
    });
  };

  const error = (message: string) => {
    addToast({
      title: 'Error',
      description: message,
      color: 'danger',
      timeout: 5000,
    });
  };

  const info = (message: string) => {
    addToast({
      title: 'Info',
      description: message,
      color: 'primary',
      timeout: 3000,
    });
  };

  const warning = (message: string) => {
    addToast({
      title: 'Warning',
      description: message,
      color: 'warning',
      timeout: 4000,
    });
  };

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
}; 