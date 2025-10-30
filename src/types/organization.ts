export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  user_role?: string;
}

export interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  
  fetchOrganizations: (userId: string) => Promise<void>;
  setCurrentOrganization: (org: Organization) => void;
  createOrganization: (data: CreateOrganizationData) => Promise<{ success: boolean; organization?: Organization; message?: string }>;
  createOrganizationWithUser: (data: CreateOrganizationData, userId: string) => Promise<{ success: boolean; organization?: Organization; message?: string }>;
  updateOrganization: (organizationId: string, data: Partial<CreateOrganizationData>) => Promise<{ success: boolean; message?: string }>;
  deleteOrganization: (organizationId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface CreateOrganizationData {
  name: string;
  display_name: string;
  description?: string;
  website?: string;
  logo_url?: string;
}

export interface OrganizationsResponse {
  karlo_organizations: Organization[];
}