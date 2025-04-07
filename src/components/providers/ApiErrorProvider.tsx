'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addConnectionErrorListener } from '@/api/axios';
import ConnectionErrorPage from '../shared/ConnectionErrorPage';

interface ApiErrorContextType {
  setConnectionError: (error: boolean) => void;
  clearConnectionError: () => void;
  isConnectionError: boolean;
}

const ApiErrorContext = createContext<ApiErrorContextType>({
  setConnectionError: () => {},
  clearConnectionError: () => {},
  isConnectionError: false,
});

export const useApiError = () => useContext(ApiErrorContext);

interface ApiErrorProviderProps {
  children: ReactNode;
}

export function ApiErrorProvider({ children }: ApiErrorProviderProps) {
  const [isConnectionError, setIsConnectionError] = useState(false);

  const setConnectionError = (error: boolean) => {
    setIsConnectionError(error);
  };

  const clearConnectionError = () => {
    setIsConnectionError(false);
  };

  const handleRetry = () => {
    clearConnectionError();
  };

  // Listen for connection errors from the Axios instance
  useEffect(() => {
    const removeListener = addConnectionErrorListener((isError) => {
      setIsConnectionError(isError);
    });

    return () => {
      removeListener();
    };
  }, []);

  return (
    <ApiErrorContext.Provider
      value={{
        setConnectionError,
        clearConnectionError,
        isConnectionError,
      }}
    >
      {isConnectionError ? (
        <ConnectionErrorPage 
          onRetry={handleRetry}
          message="We couldn't connect to our servers. The server might be down or your internet connection might be unstable."
        />
      ) : (
        children
      )}
    </ApiErrorContext.Provider>
  );
} 