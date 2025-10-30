import { useCallback } from 'react';
import { useCommentStore } from '../stores/commentStore';
import useAuthStore from '../stores/authStore';
import { CreateCommentInput, UpdateCommentInput } from '../types/comment';
import { useToast } from '../contexts/ToastContext';

export const useComment = () => {
  const { comments, loading, error, hasMore, totalCount, fetchCommentsByCard, loadMoreComments, createComment, updateComment, deleteComment, clearComments } = useCommentStore();
  const { token, user } = useAuthStore();
  const { showSuccess, showError } = useToast();

  const handleFetchCommentsByCard = useCallback(async (cardId: string) => {
    if (!token) {
      showError('Please login to view comments');
      return;
    }

    await fetchCommentsByCard(cardId, token);
  }, [token, fetchCommentsByCard, showError]);

  const handleCreateComment = useCallback(async (input: CreateCommentInput) => {
    if (!token) {
      showError('Please login to add comments');
      return null;
    }

    if (!input.comment.trim()) {
      showError('Comment cannot be empty');
      return null;
    }

    if (!input.member_id) {
      showError('Member information missing. Please refresh and try again.');
      return null;
    }

    const comment = await createComment(input, token);

    if (comment) {
      showSuccess('Comment added successfully');
    } else {
      showError('Failed to add comment');
    }

    return comment;
  }, [token, createComment, showSuccess, showError]);

  const handleUpdateComment = useCallback(async (input: UpdateCommentInput) => {
    if (!token) {
      showError('Please login to update comments');
      return null;
    }

    if (!input.comment.trim()) {
      showError('Comment cannot be empty');
      return null;
    }

    const comment = await updateComment(input, token);

    if (comment) {
      showSuccess('Comment updated successfully');
    } else {
      showError('Failed to update comment');
    }

    return comment;
  }, [token, updateComment, showSuccess, showError]);

  const handleDeleteComment = useCallback(async (id: string) => {
    if (!token) {
      showError('Please login to delete comments');
      return false;
    }

    const success = await deleteComment(id, token);

    if (success) {
      showSuccess('Comment deleted successfully');
    } else {
      showError('Failed to delete comment');
    }

    return success;
  }, [token, deleteComment, showSuccess, showError]);

  const handleLoadMoreComments = useCallback(async (cardId: string) => {
    if (!token) {
      showError('Please login to view comments');
      return;
    }

    await loadMoreComments(cardId, token);
  }, [token, loadMoreComments, showError]);

  return {
    comments,
    loading,
    error,
    user,
    hasMore,
    totalCount,
    fetchCommentsByCard: handleFetchCommentsByCard,
    loadMoreComments: handleLoadMoreComments,
    createComment: handleCreateComment,
    updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment,
    clearComments,
  };
};
