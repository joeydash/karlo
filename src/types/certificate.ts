export interface Certificate {
  id: string;
  org_name: string;
  org_id: string;
  user_id: string;
  designation?: string;
  from_date: string;
  to_date: string;
  created_at: string;
  updated_at: string;
  auth_fullname?: {
    id: string;
    fullname: string;
  };
}

export interface CertificateState {
  certificates: Certificate[];
  isLoading: boolean;
  error: string | null;

  fetchCertificates: (userId: string, orgId: string) => Promise<void>;
  fetchMemberCertificates: (userId: string, orgId: string) => Promise<void>;
  createCertificate: (data: CreateCertificateData) => Promise<{ success: boolean; message?: string }>;
  updateCertificate: (certificateId: string, data: UpdateCertificateData) => Promise<{ success: boolean; message?: string }>;
  deleteCertificate: (certificateId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface CreateCertificateData {
  org_name: string;
  org_id: string;
  user_id: string;
  designation?: string;
  from_date: string;
  to_date: string;
}

export interface UpdateCertificateData {
  designation?: string;
  from_date: string;
  to_date: string;
}

export interface CertificatesResponse {
  karlo_certificates: Certificate[];
}