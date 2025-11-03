import React, { useState, useEffect } from "react";
import {
  X,
  Move,
  ArrowRight,
  Loader2,
  Layout,
  List,
  Check,
} from "lucide-react";
import { useBoard } from "../../hooks/useBoard";
import { useKanban } from "../../hooks/useKanban";
import { useFocusManagement } from "../../hooks/useKeyboardNavigation";
import { useToast } from "../../contexts/ToastContext";

interface MoveCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardTitle: string;
  currentBoardId: string;
}

const MoveCardModal: React.FC<MoveCardModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardTitle,
  currentBoardId,
}) => {
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [boardLists, setBoardLists] = useState<any[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const { boards } = useBoard();
  const { moveCard, lists } = useKanban();
  const { showSuccess, showError } = useToast();
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Focus management for modal
  useFocusManagement(isOpen, modalRef);

  // Load saved selections from localStorage
  const loadSavedSelections = () => {
    try {
      const savedSelections = localStorage.getItem("moveCardSelections");
      if (savedSelections) {
        const { boardId, listId } = JSON.parse(savedSelections);

        // Check if the saved board still exists
        const boardExists = boards.some((board) => board.id === boardId);
        if (boardExists) {
          setSelectedBoardId(boardId);
          // Note: selectedListId will be set after lists are loaded
          return { boardId, listId };
        }
      }
    } catch (error) {
      console.error("Error loading saved move card selections:", error);
    }
    return null;
  };

  // Save selections to localStorage
  const saveSelections = (boardId: string, listId: string) => {
    try {
      localStorage.setItem(
        "moveCardSelections",
        JSON.stringify({
          boardId,
          listId,
        })
      );
    } catch (error) {
      console.error("Error saving move card selections:", error);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedSelections = loadSavedSelections();
      if (!savedSelections) {
        // If no saved selections, default to current board
        setSelectedBoardId(currentBoardId);
      }
      setSelectedListId("");
      setBoardLists([]); // Clear lists when modal opens

      // Always fetch lists for the initially selected board when modal opens
      const initialBoardId = savedSelections?.boardId || currentBoardId;
      if (initialBoardId) {
        fetchBoardLists(initialBoardId);
      }
    }
  }, [isOpen]);

  // Fetch lists when board is selected
  useEffect(() => {
    if (selectedBoardId && isOpen) {
      fetchBoardLists(selectedBoardId);
    }
  }, [selectedBoardId, isOpen]);

  // Restore saved list selection after lists are loaded
  useEffect(() => {
    if (boardLists.length > 0 && !selectedListId) {
      try {
        const savedSelections = localStorage.getItem("moveCardSelections");
        if (savedSelections) {
          const { boardId, listId } = JSON.parse(savedSelections);

          // If the saved board matches current selected board and the list exists
          if (
            boardId === selectedBoardId &&
            boardLists.some((list) => list.id === listId)
          ) {
            setSelectedListId(listId);
          }
        }
      } catch (error) {
        console.error("Error restoring saved list selection:", error);
      }
    }
  }, [boardLists, selectedBoardId, selectedListId]);
  const fetchBoardLists = async (boardId: string) => {
    setIsLoadingLists(true);
    try {
      // We need to create a GraphQL query to fetch lists for a specific board
      // For now, we'll use a simplified approach
      const response = await fetch("https://db.subspace.money/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("auth-storage")
              ? JSON.parse(localStorage.getItem("auth-storage") || "{}").state
                  ?.token
              : ""
          }`,
        },
        body: JSON.stringify({
          query: `
            query GetBoardLists($board_id: uuid!) {
              karlo_lists(
                where: {board_id: {_eq: $board_id}, is_archived: {_eq: false}},
                order_by: {position: asc}
              ) {
                id
                name
                color
                position
              }
            }
          `,
          variables: { board_id: boardId },
        }),
      });

      const result = await response.json();
      if (result.data?.karlo_lists) {
        setBoardLists(result.data.karlo_lists);
      }
    } catch (error) {
      console.error("Error fetching board lists:", error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedListId(""); // Reset list selection when board changes
    // Save board selection immediately
    saveSelections(boardId, "");
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    // Save both board and list selection
    saveSelections(selectedBoardId, listId);
  };

  const handleMoveCard = async () => {
    if (!selectedBoardId || !selectedListId) return;

    setIsMoving(true);
    try {
      // If moving within the same board, use the existing moveCard function
      if (selectedBoardId === currentBoardId) {
        // Find the current list that contains this card
        const sourceList = lists.find((list) =>
          list.karlo_cards.some((card) => card.id === cardId)
        );

        if (!sourceList) {
          showError(
            "Failed to move card",
            "Could not find the card's current list"
          );
          setIsMoving(false);
          return;
        }

        const result = await moveCard(cardId, sourceList.id, selectedListId, 0);
        if (result.success) {
          showSuccess("Card moved successfully");
          onClose();
        } else {
          showError("Failed to move card", result.message);
        }
      } else {
        // For moving between boards, we need to implement cross-board move
        // This would require updating the card's list_id to a list in another board
        const response = await fetch("https://db.subspace.money/v1/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("auth-storage")
                ? JSON.parse(localStorage.getItem("auth-storage") || "{}").state
                    ?.token
                : ""
            }`,
          },
          body: JSON.stringify({
            query: `
              mutation MoveCardToBoard($card_id: uuid!, $list_id: uuid!, $position: numeric!) {
                update_karlo_cards_by_pk(
                  pk_columns: {id: $card_id},
                  _set: {
                    list_id: $list_id,
                    position: $position
                  }
                ) {
                  id
                  list_id
                  position
                }
              }
            `,
            variables: {
              card_id: cardId,
              list_id: selectedListId,
              position: 0,
            },
          }),
        });

        const result = await response.json();
        if (result.data?.update_karlo_cards_by_pk) {
          showSuccess(
            "Card moved successfully",
            "Card has been moved to another board"
          );
          onClose();
          // Remove the moved card from current board's local state
          // The card will be removed automatically since it's no longer in this board
          window.dispatchEvent(
            new CustomEvent("cardMoved", {
              detail: {
                cardId,
                fromBoardId: currentBoardId,
                toBoardId: selectedBoardId,
              },
            })
          );
        } else {
          showError(
            "Failed to move card",
            "Could not move card to another board"
          );
        }
      }
    } catch (error) {
      console.error("Error moving card:", error);
      showError(
        "Failed to move card",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isMoving) {
      onClose();
    }
  };

  const availableBoards = boards.filter((board) => board.id !== currentBoardId);
  const currentBoard = boards.find((board) => board.id === currentBoardId);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Move className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2
                className="text-2xl font-bold text-gray-900 dark:text-white"
                id="move-modal-title"
              >
                Move Card
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-96 truncate">
                Moving: "{cardTitle}"
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isMoving}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content - Horizontal Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Board Selection */}
          <div className="flex-1 p-8 border-r border-gray-100 dark:border-gray-700">
            <div className="h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select Board
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose where to move this card
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-4">
                {/* Current Board */}
                {currentBoard && (
                  <button
                    onClick={() => handleBoardSelect(currentBoard.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${
                      selectedBoardId === currentBoard.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md scale-[1.02]"
                        : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor:
                            currentBoard.background_color || "#3B82F6",
                        }}
                      >
                        <Layout className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {currentBoard.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Current board
                        </p>
                      </div>
                    </div>
                    {selectedBoardId === currentBoard.id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600 font-medium">
                          Selected
                        </span>
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </button>
                )}

                {/* Other Boards */}
                {availableBoards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => handleBoardSelect(board.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${
                      selectedBoardId === board.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md scale-[1.02]"
                        : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: board.background_color || "#3B82F6",
                        }}
                      >
                        <Layout className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {board.name}
                        </p>
                        {board.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 max-w-48">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedBoardId === board.id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600 font-medium">
                          Selected
                        </span>
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Selection */}
          <div className="flex-1 p-8">
            <div className="h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select List
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose the destination list
                </p>
              </div>

              {!selectedBoardId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <List className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Select a board first
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Choose a board to view available lists
                  </p>
                </div>
              ) : isLoadingLists ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-xl border border-gray-200 dark:border-gray-600"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-4">
                  {boardLists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleListSelect(list.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${
                        selectedListId === list.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md scale-[1.02]"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: list.color || "#6B7280" }}
                        >
                          <List className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {list.name}
                        </p>
                      </div>
                      {selectedListId === list.id && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-600 font-medium">
                            Selected
                          </span>
                          <Check className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!isLoadingLists &&
                boardLists.length === 0 &&
                selectedBoardId && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <List className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No lists available
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      This board doesn't have any lists yet
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Fixed Footer with Actions */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-8 bg-white dark:bg-gray-800 rounded-b-3xl">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isMoving}
              className="flex-1 px-6 py-4 text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50 border border-gray-200 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleMoveCard}
              disabled={
                !selectedBoardId ||
                !selectedListId ||
                isMoving ||
                isLoadingLists
              }
              className="flex-1 flex items-center justify-center px-6 py-4 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isMoving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                  Moving Card...
                </>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5 mr-3" />
                  Move Card to Selected List
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveCardModal;
