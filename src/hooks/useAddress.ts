import { useEffect } from 'react';
import useAddressStore from '../stores/addressStore';
import { useAuth } from './useAuth';

export const useAddress = () => {
  const {
    addresses,
    isLoading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useAddressStore();

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchAddresses(user.id);
    }
  }, [user?.id]);

  return {
    addresses,
    isLoading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
  };
};
