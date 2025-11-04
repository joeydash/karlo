import React, { useState, useEffect } from "react";
import { X, Users, Plus, Check, Loader2, User, Search } from "lucide-react";
import { useKanban } from "../../hooks/useKanban";
import { useOrganization } from "../../hooks/useOrganization";
import { useAuth } from "../../hooks/useAuth";
import { useFocusManagement } from "../../hooks/useKeyboardNavigation";

interface CardMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardTitle: string;
}

const CardMemberModal: React.FC<CardMemberModalProps> = ({
  isOpen,
  onClose,
  cardId,
  cardTitle,
}) => {
  const [cardMembers, setCardMembers] = useState<any[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(-1);
  const {
    getCardMembers,
    getOrganizationMembers,
    addCardMember,
    removeCardMember,
  } = useKanban();
  const { currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const memberListRef = React.useRef<HTMLDivElement>(null);

  // Focus management for modal
  useFocusManagement(isOpen, searchInputRef);

  useEffect(() => {
    if (isOpen && cardId && currentOrganization?.id) {
      fetchData();
    }
  }, [isOpen, cardId, currentOrganization?.id]);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const [cardMembersResult, orgMembersResult] = await Promise.all([
        getCardMembers(cardId),
        getOrganizationMembers(currentOrganization!.id),
      ]);

      if (cardMembersResult.success) {
        setCardMembers(cardMembersResult.members || []);
      }

      if (orgMembersResult.success) {
        setOrganizationMembers(orgMembersResult.members || []);
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setActionLoading(`add-${userId}`);

    // Find the member to add
    const memberToAdd = organizationMembers.find(
      (member) => member.user_id === userId
    );
    if (!memberToAdd) {
      setActionLoading(null);
      return;
    }

    // Optimistic update: Add member to card immediately
    const newCardMember = {
      id: `temp-${Date.now()}`, // Temporary ID
      user_id: userId,
      card_id: cardId,
      assigned_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      authFullnameByUserId: memberToAdd.auth_fullname,
    };

    // Update local state optimistically
    setCardMembers((prev) => [...prev, newCardMember]);

    const result = await addCardMember(cardId, userId);

    if (result.success) {
      // Replace temporary member with real data by re-fetching only card members
      const cardMembersResult = await getCardMembers(cardId);
      if (cardMembersResult.success) {
        setCardMembers(cardMembersResult.members || []);
      }
    } else {
      // Revert optimistic update on failure
      setCardMembers((prev) =>
        prev.filter((member) => member.user_id !== userId)
      );
      alert(result.message || "Failed to add member");
    }

    setActionLoading(null);
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    setActionLoading(`remove-${userId}`);

    // Optimistic update: Remove member from card immediately
    const memberToRemove = cardMembers.find((member) => member.id === memberId);
    setCardMembers((prev) => prev.filter((member) => member.id !== memberId));

    const result = await removeCardMember(memberId);

    if (result.success) {
      // Success - optimistic update was correct, no need to revert
    } else {
      // Revert optimistic update on failure
      if (memberToRemove) {
        setCardMembers((prev) => [...prev, memberToRemove]);
      }
      alert(result.message || "Failed to remove member");
    }

    setActionLoading(null);
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isUserAssigned = (userId: string) => {
    return cardMembers.some((member) => member.user_id === userId);
  };

  const getCardMemberByUserId = (userId: string) => {
    return cardMembers.find((member) => member.user_id === userId);
  };

  const filteredOrganizationMembers = organizationMembers
    .filter((member) => !isUserAssigned(member.user_id)) // Only unassigned members
    .filter((member) =>
      member.auth_fullname.fullname
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ); // Filter by search term

  // Sort filtered organization members to put current user first
  const sortedFilteredMembers = filteredOrganizationMembers.sort((a, b) => {
    const isACurrent = a.user_id === currentUser?.id;
    const isBCurrent = b.user_id === currentUser?.id;

    if (isACurrent && !isBCurrent) return -1;
    if (!isACurrent && isBCurrent) return 1;
    return 0;
  });

  // Available members for keyboard navigation (unassigned only)
  const availableMembers = sortedFilteredMembers;
  const totalNavigableItems = availableMembers.length;

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || isLoading || totalNavigableItems === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedMemberIndex((prev) => {
            const next = prev + 1;
            return next >= totalNavigableItems ? 0 : next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedMemberIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? totalNavigableItems - 1 : next;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (selectedMemberIndex >= 0) {
            const member = availableMembers[selectedMemberIndex];
            if (member) {
              handleAddMember(member.user_id);
            }
          }
          break;
        case "Escape":
          if (document.activeElement !== searchInputRef.current) {
            e.preventDefault();
            searchInputRef.current?.focus();
            setSelectedMemberIndex(-1);
          }
          break;
      }
    },
    [
      isOpen,
      isLoading,
      selectedMemberIndex,
      totalNavigableItems,
      availableMembers,
      handleAddMember,
    ]
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
    setSelectedMemberIndex(-1);
  }, [searchTerm]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedMemberIndex >= 0 && memberListRef.current) {
      const items =
        memberListRef.current.querySelectorAll("[data-member-item]");
      const selectedItem = items[selectedMemberIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedMemberIndex]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
      aria-describedby="member-modal-description"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-gray-900 dark:text-white"
                id="member-modal-title"
              >
                Card Members
              </h2>
              <p
                className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-48"
                id="member-modal-description"
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
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              {/* Current Members Shimmer */}
              <div>
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32 mb-3"></div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Available Members Shimmer */}
              <div>
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-28 mb-3"></div>

                {/* Search Input Shimmer */}
                <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-lg mb-4"></div>

                {/* Member List Shimmer */}
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-24"></div>
                          <div className="h-2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-16"></div>
                        </div>
                      </div>
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Members */}
              {cardMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Assigned Members ({cardMembers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cardMembers.map((member) => (
                      <div
                        key={member.id}
                        className="relative group"
                        title={`${
                          member.authFullnameByUserId.fullname
                        } - Assigned ${new Date(
                          member.assigned_at
                        ).toLocaleDateString()}`}
                      >
                        <button
                          onClick={() =>
                            handleRemoveMember(member.id, member.user_id)
                          }
                          disabled={
                            actionLoading === `remove-${member.user_id}`
                          }
                          className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 hover:from-red-500 hover:to-red-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                          title={`Click to remove ${member.authFullnameByUserId.fullname}`}
                        >
                          <span className="text-xs font-bold text-white">
                            {getInitials(member.authFullnameByUserId.fullname)}
                          </span>
                        </button>

                        {/* Cross icon to remove member */}
                        <button
                          onClick={() =>
                            handleRemoveMember(member.id, member.user_id)
                          }
                          disabled={
                            actionLoading === `remove-${member.user_id}`
                          }
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 disabled:opacity-50 shadow-sm"
                          title="Remove from card"
                        >
                          {actionLoading === `remove-${member.user_id}` ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <X className="h-2.5 w-2.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Members */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Available Members
                </h3>

                {/* Search Input */}
                <div className="relative mb-4">
                  <label htmlFor="member-search" className="sr-only">
                    Search members
                  </label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    ref={searchInputRef}
                    id="member-search"
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    aria-describedby={
                      filteredOrganizationMembers.length > 0
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
                    {filteredOrganizationMembers.length} members found
                  </div>
                )}

                <div
                  ref={memberListRef}
                  className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {sortedFilteredMembers.map((member, index) => {
                    const isCurrentUser = member.user_id === currentUser?.id;
                    const displayName = isCurrentUser
                      ? `${member.auth_fullname.fullname} (Me)`
                      : member.auth_fullname.fullname;
                    const isSelected = selectedMemberIndex === index;

                    return (
                      <button
                        key={member.user_id}
                        data-member-item
                        onClick={() => handleAddMember(member.user_id)}
                        disabled={actionLoading === `add-${member.user_id}`}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors duration-200 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 border-2 border-transparent"
                        }`}
                        aria-label={`Add ${displayName} to card`}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                            <span className="text-xs font-bold text-white">
                              {getInitials(member.auth_fullname.fullname)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {displayName}
                            </p>
                            {member.auth_fullname.last_active && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Last active:{" "}
                                {new Date(
                                  member.auth_fullname.last_active
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-2 text-blue-600 rounded-lg">
                          {actionLoading === `add-${member.user_id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Empty States */}
              {searchTerm &&
                sortedFilteredMembers.length === 0 &&
                !isLoading && (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No members found for "{searchTerm}"
                    </p>
                    {filteredOrganizationMembers.length === 0 && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}

              {!searchTerm &&
                organizationMembers.filter(
                  (member) => !isUserAssigned(member.user_id)
                ).length === 0 &&
                !isLoading && (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      All organization members are already assigned
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard navigation help */}
      {totalNavigableItems > 0 && (
        <div className="sr-only" aria-live="polite">
          Use arrow keys to navigate, Enter to select, Escape to return to
          search
          {selectedMemberIndex >= 0 && (
            <>
              . Currently highlighting:{" "}
              {availableMembers[selectedMemberIndex]?.auth_fullname?.fullname ||
                "Unknown"}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CardMemberModal;
