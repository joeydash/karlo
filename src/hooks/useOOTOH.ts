import { useEffect } from 'react';
import useOOTOHStore from '../stores/ootohStore';
import { useOrganization } from './useOrganization';
import { useAuth } from './useAuth';

export const useOOTOH = () => {
  const {
    ootohRecords,
    todayRecord,
    total,
    isLoading,
    error,
    fetchTodayRecord,
    fetchOOTOHRecords,
    fetchAllOOTOHRecords,
    recordOOTOH,
    updateOOTOH,
    deleteOOTOH,
    approveOOTOH,
    rejectOOTOH,
  } = useOOTOHStore();

  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  useEffect(() => {
    if (currentOrganization?.id && user?.id) {
      fetchTodayRecord(currentOrganization.id, user.id);
    }
  }, [currentOrganization?.id, user?.id]);

  return {
    ootohRecords,
    todayRecord,
    total,
    isLoading,
    error,
    fetchTodayRecord,
    fetchOOTOHRecords,
    fetchAllOOTOHRecords,
    recordOOTOH,
    updateOOTOH,
    deleteOOTOH,
    approveOOTOH,
    rejectOOTOH,
  };
};
