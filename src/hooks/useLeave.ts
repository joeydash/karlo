import { useEffect } from 'react';
import useLeaveStore from '../stores/leaveStore';
import { useOrganization } from './useOrganization';

export const useLeave = () => {
  const leaveStore = useLeaveStore();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      leaveStore.fetchLeaves(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  return {
    ...leaveStore,
  };
};