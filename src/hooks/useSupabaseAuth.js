// src/hooks/useSupabaseAuth.js
import { createContext, useContext } from 'react';

// Create a context for authentication
export const AuthContext = createContext();

// Create a custom hook to use the auth context
export function useSupabaseAuth() {
  return useContext(AuthContext);
}
