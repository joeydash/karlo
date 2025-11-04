export interface Tag {
  id: string;
  name: string;
  description?: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

export interface TagState {
  tags: Tag[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;

  fetchTags: (
    organizationId: string,
    limit?: number,
    offset?: number
  ) => Promise<void>;
  createTag: (
    data: CreateTagData,
    organizationId: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateTag: (
    tagId: string,
    data: Partial<CreateTagData>
  ) => Promise<{ success: boolean; message?: string }>;
  deleteTag: (tagId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface CreateTagData {
  name: string;
  description?: string;
}

export interface TagsResponse {
  karlo_tags: Tag[];
  karlo_tags_aggregate: {
    aggregate: {
      count: number;
    };
  };
}
