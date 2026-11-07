import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** Navigation with the app's page transition. */
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback((to: string) => navigate(to, { viewTransition: true }), [navigate]);
}
