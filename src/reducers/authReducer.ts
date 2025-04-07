export type AuthState = {
  emailLoading: boolean;
  googleLoading: boolean;
  error: string | null;
};

export type AuthAction =
  | { type: 'START_EMAIL_LOADING' }
  | { type: 'START_GOOGLE_LOADING' }
  | { type: 'STOP_ALL_LOADING' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

export const initialAuthState: AuthState = {
  emailLoading: false,
  googleLoading: false,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'START_EMAIL_LOADING':
      return { ...state, emailLoading: true, error: null };
    case 'START_GOOGLE_LOADING':
      return { ...state, googleLoading: true, error: null };
    case 'STOP_ALL_LOADING':
      return { ...state, emailLoading: false, googleLoading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}
