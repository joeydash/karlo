import React, { useState } from "react";
import { Plus, MoreHorizontal, Edit3, Trash2, ArrowUpDown } from "lucide-react";
import { KanbanList as KanbanListType } from "../../types/kanban";
import { useKanban } from "../../hooks/useKanban";
import { useToast } from "../../contexts/ToastContext";
import KanbanCard from "./KanbanCard";
import EditListModal from "./EditListModal";
import ConfirmationModal from "../ConfirmationModal";

interface KanbanListProps {
  list: KanbanListType;
  onCardClick?: (cardId: string) => void;
  onCardMembersClick?: (cardId: string, cardTitle: string) => void;
  onArchiveCard?: (cardId: string) => void;
  onMoveCard?: (cardId: string, cardTitle: string) => void;
}

const KanbanList: React.FC<KanbanListProps> = ({
  list,
  onCardClick,
  onCardMembersClick,
  onArchiveCard,
  onMoveCard,
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isSortedByPriority, setIsSortedByPriority] = useState(false);
  const { createCard, moveCard, deleteList } = useKanban();
  const { showSuccess, showError } = useToast();

  // Get header style based on list color
  const getHeaderStyle = () => {
    if (list.color) {
      return {
        backgroundColor: list.color,
      };
    }
    return {};
  };
  const handleAddCard = async () => {
    if (newCardTitle.trim()) {
      const result = await createCard(list.id, { title: newCardTitle.trim() });
      if (result.success) {
        showSuccess("Card created successfully");
        setNewCardTitle("");
        setIsAddingCard(false);
      } else {
        showError(result.message || "Failed to create card");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCard();
    } else if (e.key === "Escape") {
      setIsAddingCard(false);
      setNewCardTitle("");
    }
  };

  const handleDragStart = (e: React.DragEvent, card: any) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        cardId: card.id,
        sourceListId: list.id,
      })
    );
    e.dataTransfer.effectAllowed = "move";
    setDraggedCard(card.id);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverIndex(null);
    setIsDragOver(false);
  };

  const getDropPosition = (e: React.DragEvent, cardElements: Element[]) => {
    const y = e.clientY;

    // If no cards, return 0
    if (cardElements.length === 0) {
      return 0;
    }

    // Check if dropping before the first card
    const firstCard = cardElements[0];
    const firstRect = firstCard.getBoundingClientRect();
    if (y < firstRect.top + firstRect.height / 2) {
      return 0;
    }

    // Check if dropping after the last card
    const lastCard = cardElements[cardElements.length - 1];
    const lastRect = lastCard.getBoundingClientRect();
    if (y > lastRect.top + lastRect.height / 2) {
      return cardElements.length;
    }

    // Find position between cards
    for (let i = 0; i < cardElements.length - 1; i++) {
      const currentRect = cardElements[i].getBoundingClientRect();
      const nextRect = cardElements[i + 1].getBoundingClientRect();
      const midpoint =
        currentRect.bottom + (nextRect.top - currentRect.bottom) / 2;

      if (y < midpoint) {
        return i + 1;
      }
    }

    return cardElements.length;
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);

    // Get all card elements in this list
    const cardElements = Array.from(
      e.currentTarget.querySelectorAll("[data-card-id]")
    );
    const dropIndex = getDropPosition(e, cardElements);
    setDragOverIndex(dropIndex);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the list container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverIndex(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { cardId, sourceListId } = dragData;

      // Get all card elements to calculate the drop position
      const cardElements = Array.from(
        e.currentTarget.querySelectorAll("[data-card-id]")
      );
      const dropIndex = getDropPosition(e, cardElements);

      // Move the card
      await moveCard(cardId, sourceListId, list.id, dropIndex);
    } catch (error) {
      console.error("Error dropping card:", error);
    }
  };

  const renderDropIndicator = (index: number) => {
    if (dragOverIndex === index && isDragOver) {
      return (
        <div className="h-0.5 bg-blue-500 rounded-full mx-2 my-1 transition-all duration-200" />
      );
    }
    return null;
  };

  const confirmDeleteList = async () => {
    const result = await deleteList(list.id);
    if (result.success) {
      showSuccess("List deleted successfully");
    } else {
      showError(result.message || "Failed to delete list");
    }
    setShowDeleteConfirmation(false);
    setShowOptionsMenu(false);
  };

  const handleEditList = () => {
    setShowEditModal(true);
    setShowOptionsMenu(false);
  };

  // Calculate available height for cards (viewport height minus header, padding, and margins)
  const [needsScrolling, setNeedsScrolling] = React.useState(false);

  React.useEffect(() => {
    const checkScrolling = () => {
      // Calculate available height: viewport height minus header (80px) and padding (48px top + 48px bottom)
      const availableHeight = window.innerHeight - 176; // 80 (header) + 96 (padding)

      // Estimate card height: 120px per card (including spacing)
      const estimatedCardsHeight = list.karlo_cards.length * 120;

      // Add height for list header (60px) and add card button (60px)
      const totalEstimatedHeight = estimatedCardsHeight + 120;

      setNeedsScrolling(
        totalEstimatedHeight > availableHeight && list.karlo_cards.length > 3
      );
    };

    checkScrolling();

    // Recalculate on window resize
    window.addEventListener("resize", checkScrolling);
    return () => window.removeEventListener("resize", checkScrolling);
  }, [list.karlo_cards.length]);

  return (
    <div
      data-list-id={list.id}
      className={`bg-gray-50 dark:bg-gray-800 rounded-2xl p-0 w-64 sm:w-72 md:w-80 flex-shrink-0 transition-all duration-200 ${
        isDragOver
          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed shadow-2xl"
          : "shadow-lg hover:shadow-xl"
      } ${
        needsScrolling ? "flex flex-col h-full" : "self-start"
      } border border-gray-200 dark:border-gray-700`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* List Header */}
      <div
        className="flex items-center justify-between mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-t-2xl border-b border-white border-opacity-20"
        style={getHeaderStyle()}
      >
        <h3
          className={`font-semibold text-xs sm:text-sm truncate flex-1 mr-2 ${
            list.color ? "text-white" : "text-gray-900 dark:text-white"
          }`}
        >
          <span className="truncate inline-block max-w-[140px] sm:max-w-[180px] align-middle">
            {list.name}
          </span>
          <span
            className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full inline-block align-middle ${
              list.color
                ? "text-white bg-white bg-opacity-30 border border-white border-opacity-20"
                : "text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700"
            }`}
          >
            {list.karlo_cards.length}
          </span>
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className={`p-1 rounded-lg transition-colors duration-200 ${
              list.color
                ? "hover:bg-white hover:bg-opacity-20 text-white"
                : "hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <MoreHorizontal
              className={`h-4 w-4 ${
                list.color ? "text-white" : "text-gray-500"
              }`}
            />
          </button>

          {/* Options Menu */}
          {showOptionsMenu && (
            <div className="absolute top-8 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[120px] sm:min-w-[140px]">
              <button
                onClick={() => {
                  setIsSortedByPriority(!isSortedByPriority);
                  setShowOptionsMenu(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm transition-colors duration-200 ${
                  isSortedByPriority
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Priority Sort</span>
              </button>
              <button
                onClick={handleEditList}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Edit List</span>
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirmation(true);
                  setShowOptionsMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete List</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        data-list-content
        className={`space-y-2 mb-3 px-3 ${
          needsScrolling ? "flex-1 overflow-y-auto kanban-list-scroll" : ""
        }`}
      >
        {renderDropIndicator(0)}
        {(() => {
          // Sort cards by priority if enabled (urgent to low by default)
          const cardsToRender = isSortedByPriority
            ? (() => {
                const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
                return [...list.karlo_cards].sort((a, b) => {
                  const aPriority = a.priority
                    ? priorityOrder[a.priority as keyof typeof priorityOrder] ||
                      0
                    : 0;
                  const bPriority = b.priority
                    ? priorityOrder[b.priority as keyof typeof priorityOrder] ||
                      0
                    : 0;
                  return bPriority - aPriority; // Urgent to low (descending)
                });
              })()
            : list.karlo_cards;

          return cardsToRender.map((card, index) => (
            <React.Fragment key={card.id}>
              <div
                data-card-id={card.id}
                className={draggedCard === card.id ? "opacity-50" : ""}
              >
                <KanbanCard
                  card={card}
                  onClick={() => onCardClick?.(card.id)}
                  onMembersClick={() =>
                    onCardMembersClick?.(card.id, card.title)
                  }
                  onArchiveCard={onArchiveCard}
                  onMoveCard={onMoveCard}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              </div>
              {renderDropIndicator(index + 1)}
            </React.Fragment>
          ));
        })()}
      </div>

      {/* Add Card */}
      <div className="px-3 pb-3">
        {isAddingCard ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg p-2.5 shadow-sm border border-gray-200 dark:border-gray-600">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter a title for this card..."
              className="w-full text-xs resize-none border-none outline-none placeholder-gray-500 dark:placeholder-gray-400 bg-transparent text-gray-900 dark:text-white"
              rows={2}
              autoFocus
            />
            <div className="flex items-center space-x-2 mt-1.5">
              <button
                onClick={handleAddCard}
                className="px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Add card
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }}
                className="px-2.5 py-1 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full flex items-center space-x-2 p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
          >
            <Plus className="h-4 w-4 group-hover:text-gray-800 dark:group-hover:text-gray-100" />
            <span className="text-xs font-medium group-hover:text-gray-800 dark:group-hover:text-gray-100">
              Add a card
            </span>
          </button>
        )}
      </div>

      {/* Edit List Modal */}
      <EditListModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        list={list}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteList}
        title="Delete List"
        message={`Are you sure you want to delete "${list.name}"? This will archive the list and all its cards.`}
        confirmText="Delete List"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />

      {/* Click outside to close options menu */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowOptionsMenu(false)}
        />
      )}
    </div>
  );
};

export default KanbanList;
