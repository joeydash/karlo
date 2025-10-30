import { create } from 'zustand';
import { AddressState, Address, AddressFormData, AddressesResponse, AddAddressResponse, UpdateAddressResponse, DeleteAddressResponse } from '../types/address';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_ADDRESSES: `
    query GetAddresses($userId: uuid!) {
      whatsub_addresses(
        where: { user_id: { _eq: $userId } }
        order_by: { created_at: desc }
      ) {
        id
        user_id
        name
        full_address
        contact_number
        type
        latitude
        longitude
        fhb_name
        floor
        nearby_landmark
        created_at
        updated_at
      }
    }
  `,
  ADD_ADDRESS: `
    mutation AddAddress(
      $user_id: uuid!
      $name: String!
      $full_address: String!
      $contact_number: String
      $type: String!
      $latitude: String!
      $longitude: String!
      $fhb_name: String!
      $floor: String
      $nearby_landmark: String
    ) {
      insert_whatsub_addresses_one(
        object: {
          user_id: $user_id
          name: $name
          full_address: $full_address
          contact_number: $contact_number
          type: $type
          latitude: $latitude
          longitude: $longitude
          fhb_name: $fhb_name
          floor: $floor
          nearby_landmark: $nearby_landmark
        }
      ) {
        id
        user_id
        name
        full_address
        contact_number
        type
        latitude
        longitude
        fhb_name
        floor
        nearby_landmark
        created_at
        updated_at
      }
    }
  `,
  UPDATE_ADDRESS: `
    mutation UpdateAddress(
      $id: uuid!
      $name: String
      $full_address: String
      $contact_number: String
      $type: String
      $latitude: String
      $longitude: String
      $fhb_name: String
      $floor: String
      $nearby_landmark: String
    ) {
      update_whatsub_addresses_by_pk(
        pk_columns: { id: $id }
        _set: {
          name: $name
          full_address: $full_address
          contact_number: $contact_number
          type: $type
          latitude: $latitude
          longitude: $longitude
          fhb_name: $fhb_name
          floor: $floor
          nearby_landmark: $nearby_landmark
        }
      ) {
        id
        user_id
        name
        full_address
        contact_number
        type
        latitude
        longitude
        fhb_name
        floor
        nearby_landmark
        created_at
        updated_at
      }
    }
  `,
  DELETE_ADDRESS: `
    mutation DeleteAddress($id: uuid!) {
      delete_whatsub_addresses_by_pk(id: $id) {
        id
      }
    }
  `,
};

const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  fetchAddresses: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await graphqlRequest<AddressesResponse>(
        QUERIES.GET_ADDRESSES,
        { userId }
      );

      if (result.error) {
        set({ error: result.error, isLoading: false });
        return;
      }

      set({
        addresses: result.data?.whatsub_addresses || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch addresses',
        isLoading: false,
      });
    }
  },

  addAddress: async (userId: string, data: AddressFormData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await graphqlRequest<AddAddressResponse>(
        QUERIES.ADD_ADDRESS,
        {
          user_id: userId,
          name: data.name,
          full_address: data.full_address,
          contact_number: data.contact_number || null,
          type: data.type,
          latitude: String(data.latitude),
          longitude: String(data.longitude),
          fhb_name: data.fhb_name,
          floor: data.floor || null,
          nearby_landmark: data.nearby_landmark || null,
        }
      );

      if (result.error) {
        set({ error: result.error, isLoading: false });
        return { success: false, message: result.error };
      }

      const newAddress = result.data?.insert_whatsub_addresses_one;
      if (newAddress) {
        set((state) => ({
          addresses: [newAddress, ...state.addresses],
          isLoading: false,
        }));
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add address';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  updateAddress: async (id: string, data: Partial<AddressFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const variables: any = { id };

      if (data.name !== undefined) variables.name = data.name;
      if (data.full_address !== undefined) variables.full_address = data.full_address;
      if (data.contact_number !== undefined) variables.contact_number = data.contact_number || null;
      if (data.type !== undefined) variables.type = data.type;
      if (data.latitude !== undefined) variables.latitude = String(data.latitude);
      if (data.longitude !== undefined) variables.longitude = String(data.longitude);
      if (data.fhb_name !== undefined) variables.fhb_name = data.fhb_name;
      if (data.floor !== undefined) variables.floor = data.floor || null;
      if (data.nearby_landmark !== undefined) variables.nearby_landmark = data.nearby_landmark || null;

      const result = await graphqlRequest<UpdateAddressResponse>(
        QUERIES.UPDATE_ADDRESS,
        variables
      );

      if (result.error) {
        set({ error: result.error, isLoading: false });
        return { success: false, message: result.error };
      }

      const updatedAddress = result.data?.update_whatsub_addresses_by_pk;
      if (updatedAddress) {
        set((state) => ({
          addresses: state.addresses.map(a => a.id === id ? updatedAddress : a),
          isLoading: false,
        }));
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update address';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  deleteAddress: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await graphqlRequest<DeleteAddressResponse>(
        QUERIES.DELETE_ADDRESS,
        { id }
      );

      if (result.error) {
        set({ error: result.error, isLoading: false });
        return { success: false, message: result.error };
      }

      set((state) => ({
        addresses: state.addresses.filter(a => a.id !== id),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete address';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },
}));

export default useAddressStore;
