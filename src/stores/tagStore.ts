import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TagState, CreateTagData, TagsResponse } from "../types/tag";
import { graphqlRequest } from "../utils/graphql";

const QUERIES = {
  GET_TAGS: `
    query GetOrganizationTags($organisation_id: uuid!, $limit: Int!, $offset: Int!) {
      karlo_tags(
        where: {organisation_id: {_eq: $organisation_id}},
        order_by: {created_at: desc},
        limit: $limit,
        offset: $offset
      ) {
        id
        name
        description
        organisation_id
        created_at
        updated_at
      }
      karlo_tags_aggregate(
        where: {organisation_id: {_eq: $organisation_id}}
      ) {
        aggregate {
          count
        }
      }
    }
  `,
  CREATE_TAG: `
    mutation CreateTag(
      $organisation_id: uuid!,
      $name: String!,
      $description: String
    ) {
      insert_karlo_tags_one(object: {
        organisation_id: $organisation_id,
        name: $name,
        description: $description
      }) {
        id
        name
        description
        organisation_id
        created_at
        updated_at
      }
    }
  `,
  UPDATE_TAG: `
    mutation UpdateTag(
      $id: uuid!,
      $name: String,
      $description: String
    ) {
      update_karlo_tags_by_pk(
        pk_columns: {id: $id},
        _set: {
          name: $name,
          description: $description
        }
      ) {
        id
        name
        description
        updated_at
      }
    }
  `,
  DELETE_TAG: `
    mutation DeleteTag($id: uuid!) {
      delete_karlo_tags_by_pk(id: $id) {
        id
      }
    }
  `,
};

const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: [],
      totalCount: 0,
      isLoading: false,
      error: null,

      fetchTags: async (
        organizationId: string,
        limit: number = 10,
        offset: number = 0
      ) => {
        const currentState = get();

        if (currentState.isLoading) {
          return;
        }

        set({ isLoading: true, error: null });

        const { data, error } = await graphqlRequest<TagsResponse>(
          QUERIES.GET_TAGS,
          { organisation_id: organizationId, limit, offset }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return;
        }

        const tags = data?.karlo_tags || [];
        const totalCount = data?.karlo_tags_aggregate?.aggregate?.count || 0;
        set({ tags, totalCount });
      },

      createTag: async (data: CreateTagData, organizationId: string) => {
        set({ isLoading: true, error: null });

        const { data: result, error } = await graphqlRequest<{
          insert_karlo_tags_one: TagsResponse["karlo_tags"][0];
        }>(QUERIES.CREATE_TAG, {
          ...data,
          organisation_id: organizationId,
        });

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const newTag = result?.insert_karlo_tags_one;
        if (newTag) {
          const currentState = get();
          const updatedTags = [...currentState.tags, newTag];
          set({ tags: updatedTags });
          return { success: true };
        }

        return { success: false, message: "Failed to create tag" };
      },

      updateTag: async (tagId: string, data: Partial<CreateTagData>) => {
        set({ isLoading: true, error: null });

        const { data: result, error } = await graphqlRequest<{
          update_karlo_tags_by_pk: TagsResponse["karlo_tags"][0];
        }>(QUERIES.UPDATE_TAG, {
          id: tagId,
          ...data,
        });

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const updatedTag = result?.update_karlo_tags_by_pk;
        if (updatedTag) {
          const currentState = get();
          const updatedTags = currentState.tags.map((tag) =>
            tag.id === tagId ? { ...tag, ...updatedTag } : tag
          );
          set({ tags: updatedTags });
          return { success: true };
        }

        return { success: false, message: "Failed to update tag" };
      },

      deleteTag: async (tagId: string) => {
        set({ isLoading: true, error: null });

        const { data: result, error } = await graphqlRequest<{
          delete_karlo_tags_by_pk: { id: string };
        }>(QUERIES.DELETE_TAG, { id: tagId });

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        if (result?.delete_karlo_tags_by_pk) {
          const currentState = get();
          const updatedTags = currentState.tags.filter(
            (tag) => tag.id !== tagId
          );
          set({ tags: updatedTags });
          return { success: true };
        }

        return { success: false, message: "Failed to delete tag" };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "tag-storage",
      partialize: (state) => ({ tags: state.tags }),
    }
  )
);

export default useTagStore;
