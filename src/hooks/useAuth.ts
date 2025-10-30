import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

export const useAuth = () => {
  const authStore = useAuthStore();

  useEffect(() => {
    if (!authStore.initialized) {
      authStore.initialize();
    }
  }, [authStore.initialized, authStore.initialize]);

  return authStore;
};

export const useAuthGuard = () => {
  const { authenticated, initialized } = useAuth();
  
  return {
    isAuthenticated: authenticated,
    isLoading: !initialized,
  };
};