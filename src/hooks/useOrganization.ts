import { useEffect, useRef } from 'react';
import useOrganizationStore from '../stores/organizationStore';
import { useAuth } from './useAuth';

export const useOrganization = () => {
  const organizationStore = useOrganizationStore();
  const { user, token } = useAuth();
  const hasFetchedRef = useRef(false);
  const lastFetchedUser = useRef<string | null>(null);
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    // Fetch when:
    // 1. User changes or on first load
    // 2. Token changes (indicating a token refresh happened)
    const shouldFetch = user?.id && (
      !hasFetchedRef.current ||
      lastFetchedUser.current !== user.id ||
      lastToken.current !== token
    );

    if (shouldFetch) {
      hasFetchedRef.current = true;
      lastFetchedUser.current = user.id;
      lastToken.current = token;
      organizationStore.fetchOrganizations(user.id);
    }
  }, [user?.id, token]);

  // Reset the fetch flag when user changes
  useEffect(() => {
    if (!user?.id) {
      hasFetchedRef.current = false;
      lastFetchedUser.current = null;
      lastToken.current = null;
    }
  }, [user?.id]);

  return organizationStore;
};