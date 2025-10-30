import { create } from 'zustand';
import { Comment, CreateCommentInput, UpdateCommentInput } from '../types/comment';
import { AUTH_CONFIG } from '../utils/config';
import useKanbanStore from './kanbanStore';

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  fetchCommentsByCard: (cardId: string, token: string, page?: number) => Promise<void>;
  loadMoreComments: (cardId: string, token: string) => Promise<void>;
  createComment: (input: CreateCommentInput, token: string) => Promise<Comment | null>;
  updateComment: (input: UpdateCommentInput, token: string) => Promise<Comment | null>;
  deleteComment: (id: string, token: string) => Promise<boolean>;
  clearComments: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,
  hasMore: false,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,

  fetchCommentsByCard: async (cardId: string, token: string, page: number = 1) => {
    set({ loading: true, error: null });
    try {
      const pageSize = get().pageSize;
      const offset = (page - 1) * pageSize;

      const response = await fetch(AUTH_CONFIG.GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query GetCommentsByCard($cardId: uuid!, $limit: Int!, $offset: Int!) {
              karlo_card_comments(
                where: { card_id: { _eq: $cardId } }
                order_by: { created_at: desc }
                limit: $limit
                offset: $offset
              ) {
                id
                card_id
                member_id
                user_id
                comment
                created_at
                updated_at
                auth_fullname {
                  id
                  fullname
                  dp
                }
              }
              karlo_card_comments_aggregate(
                where: { card_id: { _eq: $cardId } }
              ) {
                aggregate {
                  count
                }
              }
            }
          `,
          variables: {
            cardId,
            limit: pageSize,
            offset: offset
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to fetch comments');
      }

      const comments = data.data.karlo_card_comments;
      const totalCount = data.data.karlo_card_comments_aggregate.aggregate.count;
      const hasMore = offset + comments.length < totalCount;

      set({
        comments: page === 1 ? comments : [...get().comments, ...comments],
        loading: false,
        hasMore,
        totalCount,
        currentPage: page
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
        loading: false
      });
    }
  },

  loadMoreComments: async (cardId: string, token: string) => {
    const { currentPage, hasMore, loading } = get();
    if (!hasMore || loading) return;

    const nextPage = currentPage + 1;
    await get().fetchCommentsByCard(cardId, token, nextPage);
  },

  createComment: async (input: CreateCommentInput, token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(AUTH_CONFIG.GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreateComment($input: karlo_card_comments_insert_input!) {
              insert_karlo_card_comments_one(object: $input) {
                id
                card_id
                member_id
                user_id
                comment
                created_at
                updated_at
                auth_fullname {
                  id
                  fullname
                  dp
                }
              }
            }
          `,
          variables: { input },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to create comment');
      }

      const newComment = data.data.insert_karlo_card_comments_one;

      set((state) => ({
        comments: [newComment, ...state.comments],
        loading: false,
        totalCount: state.totalCount + 1
      }));

      // Update kanban store with new comment
      useKanbanStore.getState().addCommentToCard(input.card_id, newComment.id);

      return newComment;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create comment',
        loading: false
      });
      return null;
    }
  },

  updateComment: async (input: UpdateCommentInput, token: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(AUTH_CONFIG.GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateComment($id: uuid!, $comment: String!) {
              update_karlo_card_comments_by_pk(
                pk_columns: { id: $id }
                _set: { comment: $comment }
              ) {
                id
                card_id
                member_id
                user_id
                comment
                created_at
                updated_at
                auth_fullname {
                  id
                  fullname
                  dp
                }
              }
            }
          `,
          variables: { id: input.id, comment: input.comment },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to update comment');
      }

      const updatedComment = data.data.update_karlo_card_comments_by_pk;

      set((state) => ({
        comments: state.comments.map(c =>
          c.id === updatedComment.id ? updatedComment : c
        ),
        loading: false,
      }));

      return updatedComment;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update comment',
        loading: false
      });
      return null;
    }
  },

  deleteComment: async (id: string, token: string) => {
    set({ loading: true, error: null });
    try {
      // Get the current state to find the card_id before deleting
      const currentState = useCommentStore.getState();
      const comment = currentState.comments.find(c => c.id === id);
      const cardId = comment?.card_id;

      const response = await fetch(AUTH_CONFIG.GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation DeleteComment($id: uuid!) {
              delete_karlo_card_comments_by_pk(id: $id) {
                id
              }
            }
          `,
          variables: { id },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to delete comment');
      }

      set((state) => ({
        comments: state.comments.filter(c => c.id !== id),
        loading: false,
        totalCount: Math.max(0, state.totalCount - 1)
      }));

      // Update kanban store to remove comment
      if (cardId) {
        useKanbanStore.getState().removeCommentFromCard(cardId, id);
      }

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete comment',
        loading: false
      });
      return false;
    }
  },

  clearComments: () => {
    set({
      comments: [],
      error: null,
      hasMore: false,
      totalCount: 0,
      currentPage: 1
    });
  },
}));
