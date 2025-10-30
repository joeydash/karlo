import React, { useState, useEffect } from 'react';
import { Layout, Plus, MoreHorizontal, Eye, EyeOff, Users, Trash2, Edit3, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBoard } from '../hooks/useBoard';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import CreateBoardModal from './CreateBoardModal';
import EditBoardModal from './EditBoardModal';
import ConfirmationModal from './ConfirmationModal';
import AccessibleButton from './AccessibleButton';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { Board } from '../types/board';

const BoardGrid: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [pinnedBoards, setPinnedBoards] = useState<string[]>([]);
  const { boards, isLoading, deleteBoard } = useBoard();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Helper function to get storage key for current organization
  const getPinnedBoardsKey = () => {
    const orgId = currentOrganization?.id;
    return orgId ? `pinnedBoards_${orgId}` : 'pinnedBoards';
  };

  const visibleBoards = boards.filter(board => {
    if (board.visibility === 'private') {
      return board.created_by === user?.id;
    }
    return true;
  });

  useEffect(() => {
    const storageKey = getPinnedBoardsKey();
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setPinnedBoards(JSON.parse(stored));
    } else {
      setPinnedBoards([]);
    }
  }, [currentOrganization?.id]);

  const togglePinBoard = (boardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const storageKey = getPinnedBoardsKey();
    const updated = pinnedBoards.includes(boardId)
      ? pinnedBoards.filter(id => id !== boardId)
      : [...pinnedBoards, boardId];

    setPinnedBoards(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Dispatch event to notify SideNavigation
    window.dispatchEvent(new CustomEvent('pinnedBoardsChanged', {
      detail: { pinnedBoards: updated, organizationId: currentOrganization?.id }
    }));

    const isPinned = updated.includes(boardId);
    showSuccess(isPinned ? 'Board pinned to navigation' : 'Board unpinned');
  };

  const isPinned = (boardId: string) => pinnedBoards.includes(boardId);

  // If no organization is selected, show workspace selection message
  if (!currentOrganization && !isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Boards</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your Kanban boards</p>
          </div>
        </div>

        {/* No Organization Selected */}
        <div className="text-center py-8 sm:py-12 px-4">
          <Layout className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No workspace selected</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">Please select a workspace from the dropdown above to view and manage your boards</p>
        </div>
      </div>
    );
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <EyeOff className="h-4 w-4" />;
      case 'public':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return 'text-red-600 bg-red-50';
      case 'public':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;

    const result = await deleteBoard(boardToDelete.id);
    if (result) {
      if (pinnedBoards.includes(boardToDelete.id)) {
        const storageKey = getPinnedBoardsKey();
        const updated = pinnedBoards.filter(id => id !== boardToDelete.id);
        setPinnedBoards(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));

        // Dispatch event to notify SideNavigation
        window.dispatchEvent(new CustomEvent('pinnedBoardsChanged', {
          detail: { pinnedBoards: updated, organizationId: currentOrganization?.id }
        }));
      }
      showSuccess('Board deleted successfully');
    } else {
      showError('Failed to delete board');
    }
    setShowDeleteConfirmation(false);
    setBoardToDelete(null);
  };

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setShowEditModal(true);
    setSelectedBoard(null);
  };

  const handleDeleteClick = (board: Board) => {
    setBoardToDelete(board);
    setShowDeleteConfirmation(true);
    setSelectedBoard(null);
  };

  const handleBoardClick = (board: Board, event?: React.KeyboardEvent | React.MouseEvent) => {
    if (event && 'key' in event && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    if (event && 'key' in event) {
      event.preventDefault();
    }
    navigate(`/board/${board.id}`);
  };

  const ShimmerCard = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
      {/* Shimmer Header */}
      <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
      
      {/* Shimmer Content */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-3/4"></div>
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-1/2"></div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-1/3"></div>
          <div className="h-4 w-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Boards</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your Kanban boards</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="h-9 sm:h-10 w-20 sm:w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-xl"></div>
            <div className="h-9 sm:h-10 w-24 sm:w-32 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-900 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-xl"></div>
          </div>
        </div>

        {/* Shimmer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ShimmerCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Boards</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage your Kanban boards</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <AccessibleButton
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new board"
            className="w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Create Board</span>
          </AccessibleButton>
        </div>
      </div>

      {/* Boards Grid */}
      {visibleBoards.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <Layout className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No boards yet</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">Create your first board to get started with project management</p>
          <AccessibleButton
            onClick={() => setShowCreateModal(true)}
            aria-label="Create your first board"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Create Your First Board</span>
          </AccessibleButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {visibleBoards.map((board) => (
            <div
              key={board.id}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl focus-within:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('[data-menu-button]')) {
                  handleBoardClick(board, e);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !(e.target as HTMLElement).closest('[data-menu-button]')) {
                  handleBoardClick(board, e);
                }
              }}
              aria-label={`Open board: ${board.name}. ${board.description || 'No description'}`}
            >
              {/* Board Header */}
              <div
                className="h-28 sm:h-32 p-3 sm:p-4 flex flex-col justify-between relative"
                style={{
                  backgroundColor: board.background_color || '#3B82F6',
                  backgroundImage: board.background_image_url ? `url(${board.background_image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center space-x-1 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getVisibilityColor(board.visibility)} dark:opacity-90`}>
                      {getVisibilityIcon(board.visibility)}
                      <span className="capitalize">{board.visibility}</span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 sm:opacity-100 transition-opacity duration-200">
                      <button
                        data-menu-button
                        onClick={(e) => togglePinBoard(board.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePinBoard(board.id, e as any);
                          }
                        }}
                        className={`p-1 text-white hover:bg-white hover:bg-opacity-20 focus:bg-white focus:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${
                          isPinned(board.id) ? 'bg-white bg-opacity-20' : ''
                        }`}
                        aria-label={isPinned(board.id) ? `Unpin ${board.name}` : `Pin ${board.name} to navigation`}
                      >
                        <Pin className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isPinned(board.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        data-menu-button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBoard(board);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedBoard(board);
                          }
                        }}
                        className="p-1 text-white hover:bg-white hover:bg-opacity-20 focus:bg-white focus:bg-opacity-20 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                        aria-label={`Board options for ${board.name}`}
                      >
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-base sm:text-lg truncate">{board.name}</h3>
                </div>
              </div>

              {/* Board Content */}
              <div className="p-3 sm:p-4">
                {board.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{board.description}</p>
                )}
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  <span>Updated {new Date(board.updated_at).toLocaleDateString()}</span>
                  <Layout className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                </div>
              </div>

              {/* Dropdown Menu */}
              {selectedBoard?.id === board.id && (
                <div
                  className="absolute top-14 sm:top-16 right-2 sm:right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[140px] sm:min-w-[160px]"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBoard(board);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditBoard(board);
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-200 focus:outline-none"
                    role="menuitem"
                    tabIndex={0}
                  >
                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span>Edit Board</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(board);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(board);
                      }
                    }}
                    className="w-full flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20 transition-colors duration-200 focus:outline-none"
                    role="menuitem"
                    tabIndex={0}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                    <span>Delete Board</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {selectedBoard && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSelectedBoard(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedBoard(null);
            }
          }}
          tabIndex={-1}
        />
      )}

      <CreateBoardModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      <EditBoardModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingBoard(null);
        }}
        board={editingBoard}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setBoardToDelete(null);
        }}
        onConfirm={handleDeleteBoard}
        title="Delete Board"
        message={`Are you sure you want to delete "${boardToDelete?.name}"? This action cannot be undone and will permanently delete all lists, cards, and data associated with this board.`}
        confirmText="Delete Board"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
  );
};

export default BoardGrid;