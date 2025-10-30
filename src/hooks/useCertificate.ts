import { useEffect } from 'react';
import useCertificateStore from '../stores/certificateStore';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';

export const useCertificate = (skipAutoFetch = false) => {
  const certificateStore = useCertificateStore();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    if (user?.id && currentOrganization?.id && !skipAutoFetch) {
      certificateStore.fetchCertificates(user.id, currentOrganization.id);
    }
  }, [user?.id, currentOrganization?.id, skipAutoFetch]);

  return {
    ...certificateStore,
    fetchCertificates: certificateStore.fetchCertificates,
    fetchMemberCertificates: certificateStore.fetchMemberCertificates,
    createCertificate: certificateStore.createCertificate,
    updateCertificate: certificateStore.updateCertificate,
    deleteCertificate: certificateStore.deleteCertificate
  };
};