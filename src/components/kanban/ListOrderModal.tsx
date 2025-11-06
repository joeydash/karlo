import React, { useState, useEffect } from "react";
import {
  X,
  Layout,
  GripVertical,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { KanbanList } from "../../types/kanban";
import { useKanban } from "../../hooks/useKanban";

interface ListOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  lists: KanbanList[];
}

const ListOrderModal: React.FC<ListOrderModalProps> = ({
  isOpen,
  onClose,
  boardId,
  lists,
}) => {
  const [orderedLists, setOrderedLists] = useState<KanbanList[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { fetchBoardData } = useKanban();

  // Initialize ordered lists when modal opens
  useEffect(() => {
    if (isOpen && lists.length > 0) {
      // Sort lists by position to ensure correct order
      const sortedLists = [...lists].sort((a, b) => a.position - b.position);
      setOrderedLists(sortedLists);
    }
  }, [isOpen, lists]);

  if (!isOpen) return null;

  const moveList = (fromIndex: number, toIndex: number) => {
    const newOrderedLists = [...orderedLists];
    const [movedList] = newOrderedLists.splice(fromIndex, 1);
    newOrderedLists.splice(toIndex, 0, movedList);
    setOrderedLists(newOrderedLists);
  };

  const moveListUp = (index: number) => {
    if (index > 0) {
      moveList(index, index - 1);
    }
  };

  const moveListDown = (index: number) => {
    if (index < orderedLists.length - 1) {
      moveList(index, index + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveList(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const saveOrder = async () => {
    setIsUpdating(true);

    try {
      // Update positions using GraphQL
      const updates = orderedLists.map((list, index) => ({
        where: { id: { _eq: list.id } },
        _set: { position: index },
      }));

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
            mutation UpdateListPositions($updates: [karlo_lists_updates!]!) {
              update_karlo_lists_many(updates: $updates) {
                affected_rows
              }
            }
          `,
          variables: { updates },
        }),
      });

      const result = await response.json();

      if (result.data?.update_karlo_lists_many) {
        // Refresh board data to get updated positions
        await fetchBoardData(boardId);
        onClose();
      } else {
        throw new Error("Failed to update list positions");
      }
    } catch (error) {
      console.error("Error updating list order:", error);
      alert("Failed to save list order. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = () => {
    const originalOrder = [...lists].sort((a, b) => a.position - b.position);
    return (
      JSON.stringify(originalOrder.map((l) => l.id)) !==
      JSON.stringify(orderedLists.map((l) => l.id))
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Reorder Lists
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Drag to reorder or use arrow buttons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
          <div className="space-y-2">
            {orderedLists.map((list, index) => (
              <div
                key={list.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 transition-all duration-200 cursor-move ${
                  draggedIndex === index
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 opacity-50"
                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {/* Drag Handle */}
                <div className="text-gray-400 dark:text-gray-500">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* List Info */}
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: list.color || "#6B7280" }}
                  >
                    <Layout className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {list.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {list.karlo_cards.length} card
                      {list.karlo_cards.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Arrow Buttons */}
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => moveListUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveListDown(index)}
                    disabled={index === orderedLists.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {orderedLists.length === 0 && (
            <div className="text-center py-8">
              <Layout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No lists to reorder
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={saveOrder}
              disabled={!hasChanges() || isUpdating}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Layout className="h-4 w-4 mr-2" />
                  Save Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListOrderModal;
