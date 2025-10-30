import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CertificateState, Certificate, CreateCertificateData, UpdateCertificateData, CertificatesResponse } from '../types/certificate';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_CERTIFICATES: `
    query GetUserCertificates($user_id: uuid!, $org_id: uuid!) {
      karlo_certificates(
        where: {
          user_id: {_eq: $user_id},
          org_id: {_eq: $org_id}
        },
        order_by: {created_at: desc}
      ) {
        id
        org_name
        org_id
        user_id
        designation
        from_date
        to_date
        created_at
        updated_at
        auth_fullname {
          id
          fullname
        }
      }
    }
  `,
  GET_MEMBER_CERTIFICATES: `
    query GetMemberCertificates($user_id: uuid!, $org_id: uuid!) {
      karlo_certificates(
        where: {
          user_id: {_eq: $user_id},
          org_id: {_eq: $org_id}
        },
        order_by: {created_at: desc}
      ) {
        id
        org_name
        org_id
        user_id
        designation
        from_date
        to_date
        created_at
        updated_at
        auth_fullname {
          id
          fullname
        }
      }
    }
  `,
  CREATE_CERTIFICATE: `
    mutation CreateCertificate(
      $org_name: String!,
      $org_id: uuid!,
      $user_id: uuid!,
      $designation: String,
      $from_date: date!,
      $to_date: date!
    ) {
      insert_karlo_certificates_one(object: {
        org_name: $org_name,
        org_id: $org_id,
        user_id: $user_id,
        designation: $designation,
        from_date: $from_date,
        to_date: $to_date
      }) {
        id
        org_name
        org_id
        user_id
        designation
        from_date
        to_date
        created_at
        updated_at
        auth_fullname {
          id
          fullname
        }
      }
    }
  `,
  UPDATE_CERTIFICATE: `
    mutation UpdateCertificate(
      $id: uuid!,
      $designation: String,
      $from_date: date,
      $to_date: date
    ) {
      update_karlo_certificates_by_pk(
        pk_columns: {id: $id},
        _set: {
          designation: $designation,
          from_date: $from_date,
          to_date: $to_date
        }
      ) {
        id
        org_name
        org_id
        user_id
        designation
        from_date
        to_date
        created_at
        updated_at
        auth_fullname {
          id
          fullname
        }
      }
    }
  `,
  DELETE_CERTIFICATE: `
    mutation DeleteCertificate($id: uuid!) {
      delete_karlo_certificates_by_pk(id: $id) {
        id
      }
    }
  `
};

const useCertificateStore = create<CertificateState>()(
  persist(
    (set, get) => ({
      certificates: [],
      isLoading: false,
      error: null,

      fetchCertificates: async (userId: string, orgId: string) => {
        const currentState = get();

        if (currentState.isLoading) {
          return;
        }

        set({ isLoading: true, error: null });

        const { data, error } = await graphqlRequest<CertificatesResponse>(
          QUERIES.GET_CERTIFICATES,
          { user_id: userId, org_id: orgId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return;
        }

        const certificates = data?.karlo_certificates || [];
        set({ certificates });
      },

      fetchMemberCertificates: async (userId: string, orgId: string) => {
        set({ isLoading: true, error: null });

        const { data, error } = await graphqlRequest<CertificatesResponse>(
          QUERIES.GET_MEMBER_CERTIFICATES,
          { user_id: userId, org_id: orgId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return;
        }

        const certificates = data?.karlo_certificates || [];
        set({ certificates });
      },

      createCertificate: async (data: CreateCertificateData) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.CREATE_CERTIFICATE,
          data
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const newCertificate = result?.insert_karlo_certificates_one;
        if (newCertificate) {
          const currentState = get();
          const updatedCertificates = [newCertificate, ...currentState.certificates];
          set({ certificates: updatedCertificates });
          return { success: true };
        }

        return { success: false, message: 'Failed to create certificate' };
      },

      updateCertificate: async (certificateId: string, data: UpdateCertificateData) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.UPDATE_CERTIFICATE,
          {
            id: certificateId,
            ...data
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const updatedCertificate = result?.update_karlo_certificates_by_pk;
        if (updatedCertificate) {
          const currentState = get();
          const updatedCertificates = currentState.certificates.map(certificate => 
            certificate.id === certificateId ? { ...certificate, ...updatedCertificate } : certificate
          );
          set({ certificates: updatedCertificates });
          return { success: true };
        }

        return { success: false, message: 'Failed to update certificate' };
      },

      deleteCertificate: async (certificateId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.DELETE_CERTIFICATE,
          { id: certificateId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        if (result?.delete_karlo_certificates_by_pk) {
          const currentState = get();
          const updatedCertificates = currentState.certificates.filter(certificate => certificate.id !== certificateId);
          set({ certificates: updatedCertificates });
          return { success: true };
        }

        return { success: false, message: 'Failed to delete certificate' };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'certificate-storage',
      partialize: (state) => ({
        certificates: state.certificates,
      }),
    }
  )
);

export default useCertificateStore;