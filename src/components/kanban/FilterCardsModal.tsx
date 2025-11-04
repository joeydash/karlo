import React, { useState } from "react";
import {
  X,
  Filter,
  Tag,
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useTag } from "../../hooks/useTag";
import { useFocusManagement } from "../../hooks/useKeyboardNavigation";

interface FilterCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPriorities: string[];
  selectedTagIds: string[];
  selectedStoryPoints: number[];
  dueDateFilter: string;
  prioritySort: string;
  onFiltersChange: (filters: {
    priorities: string[];
    tagIds: string[];
    storyPoints: number[];
    dueDate: string;
    prioritySort: string;
  }) => void;
}

const FilterCardsModal: React.FC<FilterCardsModalProps> = ({
  isOpen,
  onClose,
  selectedPriorities,
  selectedTagIds,
  selectedStoryPoints,
  dueDateFilter,
  prioritySort,
  onFiltersChange,
}) => {
  const { tags } = useTag();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Focus management for modal
  useFocusManagement(isOpen, searchInputRef);

  const priorities = [
    { value: "low", label: "Low", color: "bg-gray-500" },
    { value: "normal", label: "Normal", color: "bg-blue-500" },
    { value: "high", label: "High", color: "bg-orange-500" },
    { value: "urgent", label: "Urgent", color: "bg-red-500" },
  ];

  const storyPointsOptions = [1, 2, 3, 5, 8, 13, 20, 40];

  const dueDateOptions = [
    { value: "", label: "All" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Due Today" },
    { value: "week", label: "Due This Week" },
    { value: "month", label: "Due This Month" },
    { value: "no-date", label: "No Due Date" },
  ];

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = selectedPriorities.includes(priority)
      ? selectedPriorities.filter((p) => p !== priority)
      : [...selectedPriorities, priority];

    onFiltersChange({
      priorities: newPriorities,
      tagIds: selectedTagIds,
      storyPoints: selectedStoryPoints,
      dueDate: dueDateFilter,
      prioritySort: prioritySort,
    });
  };

  const handleTagToggle = (tagId: string) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    onFiltersChange({
      priorities: selectedPriorities,
      tagIds: newTagIds,
      storyPoints: selectedStoryPoints,
      dueDate: dueDateFilter,
      prioritySort: prioritySort,
    });
  };

  const handleStoryPointToggle = (points: number) => {
    const newPoints = selectedStoryPoints.includes(points)
      ? selectedStoryPoints.filter((p) => p !== points)
      : [...selectedStoryPoints, points];

    onFiltersChange({
      priorities: selectedPriorities,
      tagIds: selectedTagIds,
      storyPoints: newPoints,
      dueDate: dueDateFilter,
      prioritySort: prioritySort,
    });
  };

  const handleDueDateChange = (value: string) => {
    onFiltersChange({
      priorities: selectedPriorities,
      tagIds: selectedTagIds,
      storyPoints: selectedStoryPoints,
      dueDate: value,
      prioritySort: prioritySort,
    });
  };

  const handlePrioritySortChange = (value: string) => {
    // If clicking the same sort button, remove the sort
    const newSortValue = prioritySort === value ? "" : value;

    onFiltersChange({
      priorities: selectedPriorities,
      tagIds: selectedTagIds,
      storyPoints: selectedStoryPoints,
      dueDate: dueDateFilter,
      prioritySort: newSortValue,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({
      priorities: [],
      tagIds: [],
      storyPoints: [],
      dueDate: "",
      prioritySort: "",
    });
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeFiltersCount =
    selectedPriorities.length +
    selectedTagIds.length +
    selectedStoryPoints.length +
    (dueDateFilter ? 1 : 0) +
    (prioritySort ? 1 : 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-modal-title"
      aria-describedby="filter-modal-description"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-gray-900 dark:text-white"
                id="filter-modal-title"
              >
                Filter Cards
              </h2>
              <p
                className="text-sm text-gray-600 dark:text-gray-300"
                id="filter-modal-description"
              >
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} filter${
                      activeFiltersCount !== 1 ? "s" : ""
                    } active`
                  : "Customize card visibility"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear All Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              >
                Clear all
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Priority Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Priority
              </h3>
              {selectedPriorities.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({selectedPriorities.length})
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {priorities.map((priority) => {
                const isSelected = selectedPriorities.includes(priority.value);
                return (
                  <button
                    key={priority.value}
                    onClick={() => handlePriorityToggle(priority.value)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${priority.color}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {priority.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Priority Sort */}
            <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Sort by Priority
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrioritySortChange("low-to-urgent")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    prioritySort === "low-to-urgent"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  Low → Urgent
                </button>
                <button
                  onClick={() => handlePrioritySortChange("urgent-to-low")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    prioritySort === "urgent-to-low"
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  Urgent → Low
                </button>
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Tags
              </h3>
              {selectedTagIds.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({selectedTagIds.length})
                </span>
              )}
            </div>

            {/* Search Tags */}
            {tags.length > 5 && (
              <div className="relative mb-3">
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
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {filteredTags.length === 0 ? (
                <div className="text-center py-4">
                  <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No tags found" : "No tags available"}
                  </p>
                </div>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border-2 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-700"
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {tag.name}
                        </p>
                        {tag.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {tag.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Story Points Filter */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Story Points
              </h3>
              {selectedStoryPoints.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({selectedStoryPoints.length})
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {storyPointsOptions.map((points) => {
                const isSelected = selectedStoryPoints.includes(points);
                return (
                  <button
                    key={points}
                    onClick={() => handleStoryPointToggle(points)}
                    className={`px-3 py-1.5 rounded-xl transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <span className="text-sm font-medium">{points}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date Filter */}
          {/* <div>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Due Date
              </h3>
            </div>
            <div className="space-y-2">
              {dueDateOptions.map((option) => {
                const isSelected = dueDateFilter === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleDueDateChange(option.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-700"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default FilterCardsModal;
