import React, { useState } from "react";
import { X, Tag, Search, Plus } from "lucide-react";
import { useTag } from "../../hooks/useTag";
import { useFocusManagement } from "../../hooks/useKeyboardNavigation";

interface CardTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardTitle: string;
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
}

const CardTagModal: React.FC<CardTagModalProps> = ({
  isOpen,
  onClose,
  cardTitle,
  selectedTagIds,
  onToggleTag,
}) => {
  const { tags } = useTag();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagIndex, setSelectedTagIndex] = useState<number>(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const tagListRef = React.useRef<HTMLDivElement>(null);

  // Focus management for modal
  useFocusManagement(isOpen, searchInputRef);

  // Filter tags based on search term
  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false)
  );

  // Separate selected and unselected tags
  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const availableTags = filteredTags.filter(
    (tag) => !selectedTagIds.includes(tag.id)
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || availableTags.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedTagIndex((prev) => {
            const next = prev + 1;
            return next >= availableTags.length ? 0 : next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedTagIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? availableTags.length - 1 : next;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (selectedTagIndex >= 0) {
            const tag = availableTags[selectedTagIndex];
            if (tag) {
              onToggleTag(tag.id);
            }
          }
          break;
        case "Escape":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            searchInputRef.current?.focus();
            setSelectedTagIndex(-1);
          }
          break;
      }
    },
    [isOpen, selectedTagIndex, availableTags, onToggleTag]
  );

  // Add keyboard event listener
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, isOpen]);

  // Reset selection when search term changes
  React.useEffect(() => {
    setSelectedTagIndex(-1);
  }, [searchTerm]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedTagIndex >= 0 && tagListRef.current) {
      const items = tagListRef.current.querySelectorAll("[data-tag-item]");
      const selectedItem = items[selectedTagIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedTagIndex]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm("");
    setSelectedTagIndex(-1);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-modal-title"
      aria-describedby="tag-modal-description"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-gray-900 dark:text-white"
                id="tag-modal-title"
              >
                Card Tags
              </h2>
              <p
                className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-48"
                id="tag-modal-description"
              >
                {cardTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Selected Tags ({selectedTags.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="relative group"
                      title={tag.description || tag.name}
                    >
                      <button
                        onClick={() => onToggleTag(tag.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-gray-200 dark:border-gray-600 hover:from-red-500 hover:to-red-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        title={`Click to remove ${tag.name}`}
                      >
                        <span className="text-xs font-bold text-white">
                          {tag.name}
                        </span>
                      </button>

                      {/* Cross icon to remove tag */}
                      <button
                        onClick={() => onToggleTag(tag.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-sm"
                        title="Remove tag"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Tags */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Available Tags ({availableTags.length})
              </h3>

              {/* Search Input */}
              <div className="relative mb-4">
                <label htmlFor="tag-search" className="sr-only">
                  Search tags
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  ref={searchInputRef}
                  id="tag-search"
                  type="text"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  aria-describedby={
                    availableTags.length > 0
                      ? "search-results-count"
                      : undefined
                  }
                  autoFocus
                />
              </div>

              {searchTerm && (
                <div
                  id="search-results-count"
                  className="sr-only"
                  aria-live="polite"
                >
                  {availableTags.length} tags found
                </div>
              )}

              <div
                ref={tagListRef}
                className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar"
              >
                {availableTags.map((tag, index) => {
                  const isSelected = selectedTagIndex === index;

                  return (
                    <button
                      key={tag.id}
                      data-tag-item
                      onClick={() => onToggleTag(tag.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isSelected
                          ? "bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500"
                          : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 border-2 border-transparent"
                      }`}
                      aria-label={`Add ${tag.name} tag to card`}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start flex-1 min-w-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {tag.name}
                          </p>
                          {tag.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {tag.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-2 text-blue-600 rounded-lg">
                        <Plus className="h-4 w-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty States */}
            {searchTerm && availableTags.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No tags found for "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Clear search
                </button>
              </div>
            )}

            {!searchTerm && tags.length === 0 && (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No tags available
                </p>
              </div>
            )}

            {!searchTerm && tags.length > 0 && availableTags.length === 0 && (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  All tags are already selected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard navigation help */}
      {availableTags.length > 0 && (
        <div className="sr-only" aria-live="polite">
          Use arrow keys to navigate, Enter to select, Escape to return to
          search
          {selectedTagIndex >= 0 && (
            <>
              . Currently highlighting:{" "}
              {availableTags[selectedTagIndex]?.name || "Unknown"}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CardTagModal;
