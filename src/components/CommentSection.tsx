import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Edit2, Trash2, X, Check } from 'lucide-react';
import { useComment } from '../hooks/useComment';
import { Comment } from '../types/comment';
import ConfirmationModal from './ConfirmationModal';

interface CommentSectionProps {
  cardId: string;
  memberId?: string | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ cardId }) => {
  const { comments, loading, user, hasMore, totalCount, fetchCommentsByCard, loadMoreComments, createComment, updateComment, deleteComment, clearComments } = useComment();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: string; text: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (cardId) {
      fetchCommentsByCard(cardId);
    }

    return () => {
      clearComments();
    };
  }, [cardId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || submitting) return;

    if (!user?.member_id) {
      console.error('Member ID not found for current user');
      return;
    }

    setSubmitting(true);
    const result = await createComment({
      card_id: cardId,
      member_id: user.member_id,
      user_id: user?.id || '',
      comment: newComment.trim(),
    });

    if (result) {
      setNewComment('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setSubmitting(false);
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentText.trim() || submitting) return;

    setSubmitting(true);
    const result = await updateComment({
      id: commentId,
      comment: editingCommentText.trim(),
    });

    if (result) {
      setEditingCommentId(null);
      setEditingCommentText('');
    }
    setSubmitting(false);
  };

  const handleDeleteClick = (commentId: string, commentText: string) => {
    setCommentToDelete({ id: commentId, text: commentText });
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);
    const success = await deleteComment(commentToDelete.id);

    if (success) {
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
    setIsDeleting(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({totalCount})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const isOwner = user?.id === comment.user_id;
            const memberName = comment.auth_fullname
              ? comment.auth_fullname.fullname
              : 'Unknown User';

            return (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  {comment.auth_fullname?.dp ? (
                    <img
                      src={comment.auth_fullname.dp}
                      alt={memberName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {comment.auth_fullname ? getInitials(comment.auth_fullname.fullname) : '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {isOwner ? `${memberName} (You)` : memberName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(comment.created_at)}
                        {comment.created_at !== comment.updated_at && ' (edited)'}
                      </p>
                    </div>

                    {isOwner && !isEditing && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                          title="Edit comment"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(comment.id, comment.comment)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        disabled={submitting}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={submitting || !editingCommentText.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors duration-200"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={submitting}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {comment.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => loadMoreComments(cardId)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Loading...
                </>
              ) : (
                `Load More (${totalCount - comments.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitComment} className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {user?.dp ? (
              <img
                src={user.dp}
                alt="Your avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.fullname ? getInitials(user.fullname) : 'U'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextareaChange}
              placeholder="Write a comment..."
              className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              rows={1}
              disabled={submitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmitComment(e);
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press Ctrl+Enter to submit
              </p>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message={`Are you sure you want to delete this comment? "${commentToDelete?.text.substring(0, 50)}${(commentToDelete?.text.length || 0) > 50 ? '...' : ''}" This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CommentSection;
