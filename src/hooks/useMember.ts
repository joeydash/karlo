import { useEffect } from 'react';
import useMemberStore from '../stores/memberStore';
import { useOrganization } from './useOrganization';

export const useMember = () => {
  const memberStore = useMemberStore();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (currentOrganization?.id) {
      memberStore.fetchMembers(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  return {
    ...memberStore,
    inviteMember: memberStore.inviteMember,
    deleteMember: memberStore.deleteMember,
    updateMemberJoiningDate: memberStore.updateMemberJoiningDate,
    updateMemberRole: memberStore.updateMemberRole,
    updateMemberDesignation: memberStore.updateMemberDesignation,
    updateMemberCompensation: memberStore.updateMemberCompensation
  };
};