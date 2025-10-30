import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationState, Organization, CreateOrganizationData, OrganizationsResponse } from '../types/organization';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_ORGANIZATIONS: `
    query GetOrganizations($user_id: uuid!) {
      karlo_organizations(where: {_and: [{is_active: {_eq: true}}, {_or: [{karlo_organization_members: {user_id: {_eq: $user_id}}}, {created_by: {_eq: $user_id}}]}]}) {
        created_at
        created_by
        description
        display_name
        id
        is_active
        logo_url
        name
        updated_at
        website
        karlo_organization_members(where: {user_id: {_eq: $user_id}}) {
          role
        }
      }
    }
  `,
  CREATE_ORGANIZATION: `
    mutation CreateOrganization($name: String!, $display_name: String!, $description: String, $website: String, $logo_url: String, $created_by: uuid!) {
      insert_karlo_organizations_one(object: {
        name: $name,
        display_name: $display_name,
        description: $description,
        website: $website,
        logo_url: $logo_url,
        created_by: $created_by,
        is_active: true
      }) {
        id
        name
        display_name
        description
        website
        logo_url
        is_active
        created_by
        created_at
        updated_at
      }
    }
  `,
  ADD_ORGANIZATION_MEMBER: `
    mutation MyMutation($organization_id: uuid = "", $user_id: uuid = "", $joining_date: timestamp = "") {
      insert_karlo_organization_members(objects: {organization_id: $organization_id, role: "admin", user_id: $user_id, joining_date: $joining_date}) {
        affected_rows
      }
    }
  `,
  UPDATE_ORGANIZATION: `
    mutation UpdateOrganization($id: uuid!, $name: String, $display_name: String, $description: String, $website: String, $logo_url: String) {
      update_karlo_organizations_by_pk(
        pk_columns: {id: $id},
        _set: {
          name: $name,
          display_name: $display_name,
          description: $description,
          website: $website,
          logo_url: $logo_url
        }
      ) {
        id
        name
        display_name
        description
        website
        logo_url
        updated_at
      }
    }
  `,
  DELETE_ORGANIZATION: `
    mutation DeleteOrganization($id: uuid!) {
      update_karlo_organizations_by_pk(
        pk_columns: {id: $id},
        _set: {is_active: false}
      ) {
        id
        is_active
      }
    }
  `
};

const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      organizations: [],
      currentOrganization: null,
      isLoading: false,
      error: null,

      fetchOrganizations: async (userId: string) => {
        const currentState = get();
        // Prevent multiple simultaneous fetches
        if (currentState.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        const { data, error } = await graphqlRequest<OrganizationsResponse>(
          QUERIES.GET_ORGANIZATIONS,
          { user_id: userId }
        );

        if (error) {
          set({ error, isLoading: false });
          return;
        }

        const organizations = data?.karlo_organizations || [];
        
        // Add user role to each organization
        const organizationsWithRole = organizations.map(org => ({
          ...org,
          user_role: org.karlo_organization_members?.[0]?.role || 'member'
        }));

        const currentState2 = get();
        
        // Determine which organization to select
        let selectedOrganization = null;
        
        // First priority: Check if current organization still exists on the server
        if (currentState2.currentOrganization) {
          selectedOrganization = organizationsWithRole.find(
            org => org.id === currentState2.currentOrganization?.id
          );
        }
        
        // Second priority: If no current organization or it doesn't exist, try to restore from localStorage
        if (!selectedOrganization) {
          try {
            const savedOrgId = localStorage.getItem('currentOrganizationId');
            if (savedOrgId) {
              selectedOrganization = organizationsWithRole.find(org => org.id === savedOrgId);
            }
          } catch (error) {
            console.error('Error reading saved organization ID:', error);
          }
        }
        
        // Final fallback: Select the first available organization
        if (!selectedOrganization && organizationsWithRole.length > 0) {
          selectedOrganization = organizationsWithRole[0];
        }
        
        set({ 
          organizations: organizationsWithRole, 
          isLoading: false,
          currentOrganization: selectedOrganization
        });
        
        // Save the selected organization ID to localStorage for persistence
        if (selectedOrganization) {
          try {
            localStorage.setItem('currentOrganizationId', selectedOrganization.id);
          } catch (error) {
            console.error('Error saving organization ID:', error);
          }
        }
      },

      setCurrentOrganization: (org: Organization) => {
        // Save to localStorage when organization is manually changed
        try {
          localStorage.setItem('currentOrganizationId', org.id);
        } catch (error) {
          console.error('Error saving organization ID:', error);
        }
        set({ currentOrganization: org });
      },

      createOrganization: async (data: CreateOrganizationData) => {
        set({ isLoading: true, error: null });
        
        // We'll get the user ID from the component that calls this
        // This will be passed as a parameter
        return { success: false, message: 'User ID required' };
      },

      createOrganizationWithUser: async (data: CreateOrganizationData, userId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.CREATE_ORGANIZATION,
          {
            ...data,
            created_by: userId
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const newOrg = result?.insert_karlo_organizations_one;
        if (newOrg) {
          // Add the creator as an admin member
          const { data: memberResult, error: memberError } = await graphqlRequest<any>(
            QUERIES.ADD_ORGANIZATION_MEMBER,
            {
              organization_id: newOrg.id,
              user_id: userId,
              joining_date: new Date().toISOString()
            }
          );

          if (memberError) {
            console.error('Failed to add creator as admin:', memberError);
            // Don't fail the organization creation if adding member fails
          } else if (memberResult?.insert_karlo_organization_members?.affected_rows > 0) {
            console.log('Successfully added creator as admin member');
          }

          const currentState = get();
          const updatedOrganizations = [...currentState.organizations, newOrg];
          set({ 
            organizations: updatedOrganizations,
            currentOrganization: newOrg
          });
          return { success: true, organization: newOrg };
        }

        return { success: false, message: 'Failed to create organization' };
      },

      updateOrganization: async (organizationId: string, data: Partial<CreateOrganizationData>) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.UPDATE_ORGANIZATION,
          {
            id: organizationId,
            ...data
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const updatedOrg = result?.update_karlo_organizations_by_pk;
        if (updatedOrg) {
          const currentState = get();
          const updatedOrganizations = currentState.organizations.map(org => 
            org.id === organizationId ? { ...org, ...updatedOrg } : org
          );
          set({ 
            organizations: updatedOrganizations,
            currentOrganization: currentState.currentOrganization?.id === organizationId 
              ? { ...currentState.currentOrganization, ...updatedOrg }
              : currentState.currentOrganization
          });
          return { success: true };
        }

        return { success: false, message: 'Failed to update organization' };
      },

      deleteOrganization: async (organizationId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.DELETE_ORGANIZATION,
          { id: organizationId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        if (result?.update_karlo_organizations_by_pk) {
          const currentState = get();
          const updatedOrganizations = currentState.organizations.filter(org => org.id !== organizationId);
          set({ 
            organizations: updatedOrganizations,
            currentOrganization: currentState.currentOrganization?.id === organizationId 
              ? (updatedOrganizations.length > 0 ? updatedOrganizations[0] : null)
              : currentState.currentOrganization
          });
          return { success: true };
        }

        return { success: false, message: 'Failed to delete organization' };
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'organization-storage',
      storage: {
        getItem: (name) => {
          // Use sessionStorage for role data to refresh on page load
          const sessionData = sessionStorage.getItem(name);
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData);
              // If we have session data, use it
              return sessionData;
            } catch {
              // Fall back to localStorage if session data is invalid
              return localStorage.getItem(name);
            }
          }
          // Fall back to localStorage
          return localStorage.getItem(name);
        },
        setItem: (name, value) => {
          // Store in both sessionStorage and localStorage
          sessionStorage.setItem(name, value);
          localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
          localStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        organizations: state.organizations,
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);

export default useOrganizationStore;