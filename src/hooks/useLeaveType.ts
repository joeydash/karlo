import { useEffect } from 'react';
import useLeaveTypeStore from '../stores/leaveTypeStore';
import { useOrganization } from './useOrganization';

export const useLeaveType = () => {
  const leaveTypeStore = useLeaveTypeStore();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      leaveTypeStore.fetchLeaveTypes(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  return {
    ...leaveTypeStore,
    fetchLeaveTypes: leaveTypeStore.fetchLeaveTypes,
    createLeaveType: leaveTypeStore.createLeaveType,
    updateLeaveType: leaveTypeStore.updateLeaveType,
    deleteLeaveType: leaveTypeStore.deleteLeaveType
  };
};