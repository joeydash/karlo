export interface Address {
  id: string;
  user_id: string;
  name: string;
  full_address: string;
  contact_number?: string;
  type: 'home' | 'work' | 'hotel' | 'other';
  latitude: string;
  longitude: string;
  fhb_name: string;
  floor?: string;
  nearby_landmark?: string;
  created_at: string;
  updated_at: string;
}

export interface AddressFormData {
  name: string;
  full_address: string;
  contact_number: string;
  type: 'home' | 'work' | 'hotel' | 'other';
  latitude: string;
  longitude: string;
  fhb_name: string;
  floor: string;
  nearby_landmark: string;
}

export interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  fetchAddresses: (userId: string) => Promise<void>;
  addAddress: (userId: string, data: AddressFormData) => Promise<{ success: boolean; message?: string }>;
  updateAddress: (id: string, data: Partial<AddressFormData>) => Promise<{ success: boolean; message?: string }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export interface AddressesResponse {
  whatsub_addresses: Address[];
}

export interface AddAddressResponse {
  insert_whatsub_addresses_one: Address;
}

export interface UpdateAddressResponse {
  update_whatsub_addresses_by_pk: Address;
}

export interface DeleteAddressResponse {
  delete_whatsub_addresses_by_pk: {
    id: string;
  };
}
