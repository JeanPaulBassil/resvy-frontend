import { useReducer } from 'react';

import { authReducer, initialAuthState } from '@/reducers/authReducer';

export function useAuthState() {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  return {
    state,
    dispatch,
    startEmailLoading: () => dispatch({ type: 'START_EMAIL_LOADING' }),
    startGoogleLoading: () => dispatch({ type: 'START_GOOGLE_LOADING' }),
    stopAllLoading: () => dispatch({ type: 'STOP_ALL_LOADING' }),
    setError: (error: string) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };
}
