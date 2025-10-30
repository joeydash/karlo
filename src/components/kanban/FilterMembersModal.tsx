import React, { useState, useEffect } from 'react';
import { X, Users, Check, User, Search, Plus, Loader2 } from 'lucide-react';
import { useKanban } from '../../hooks/useKanban';
import { useMember } from '../../hooks/useMember';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance } from '../../hooks/useAttendance';
import { useFocusManagement } from '../../hooks/useKeyboardNavigation';

interface FilterMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemberIds: string[];
  onMembersChange: (memberIds: string[]) => void;
  boardId: string;
}

const FilterMembersModal: React.FC<FilterMembersModalProps> = ({
  isOpen,
  onClose,
  selectedMemberIds,
  onMembersChange,
  boardId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(-1);
  const [toggleLoadingMemberId, setToggleLoadingMemberId] = useState<string | null>(null);
  const { members } = useMember();
  const { user: currentUser } = useAuth();
  const { isMarked, toggleAttendance, fetchAttendanceForDate } = useAttendance();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const memberListRef = React.useRef<HTMLDivElement>(null);

  // Check if current user is admin - get from member store
  const currentUserMember = members.find(member => member.user_id === currentUser?.id);
  const isCurrentUserAdmin = currentUserMember?.role === 'admin';
  
  // Focus management for modal
  useFocusManagement(isOpen, searchInputRef);

  // Fetch attendance data when modal opens
  useEffect(() => {
    if (isOpen && members.length > 0) {
      const memberIds = members.map(member => member.id);
      const today = new Date().toISOString().split('T')[0];
      fetchAttendanceForDate(memberIds, today);
    }
  }, [isOpen, members, fetchAttendanceForDate]);

  const handleMemberToggle = (userId: string) => {
    console.log('👤 Toggling member:', userId);
    if (selectedMemberIds.includes(userId)) {
      // Remove member
      const newIds = selectedMemberIds.filter(id => id !== userId);
      console.log('➖ Removing member, new selection:', newIds);
      onMembersChange(newIds);
    } else {
      // Add member
      const newIds = [...selectedMemberIds, userId];
      console.log('➕ Adding member, new selection:', newIds);
      onMembersChange(newIds);
    }
  };

  const handleUnassignedToggle = () => {
    const unassignedId = 'unassigned';
    console.log('📋 Toggling unassigned filter');
    if (selectedMemberIds.includes(unassignedId)) {
      const newIds = selectedMemberIds.filter(id => id !== unassignedId);
      console.log('➖ Removing unassigned, new selection:', newIds);
      onMembersChange(newIds);
    } else {
      const newIds = [...selectedMemberIds, unassignedId];
      console.log('➕ Adding unassigned, new selection:', newIds);
      onMembersChange(newIds);
    }
  };

  const handleAttendanceToggle = async (userId: string) => {
    if (!isCurrentUserAdmin) {
      return;
    }
    
    if (members.length === 0) return;
    
    console.log('📋 Toggling attendance for user:', userId);
    
    // Find the member record by user_id to get member_id
    const member = members.find(m => m.user_id === userId);
    if (!member?.id) {
      console.error('Member not found for user:', userId);
      return;
    }
    
    setToggleLoadingMemberId(member.id);
    // Get today's date in YYYY-MM-DD format for attendance marking
    const today = new Date().toISOString().split('T')[0];
    const result = await toggleAttendance(member.id, today);
    setToggleLoadingMemberId(null);
    
    if (!result.success) {
      console.error('Failed to toggle attendance:', result.message);
    }
  };

  const handleClearAll = () => {
    console.log('🧹 Clearing all filters');
    onMembersChange([]);
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredMembers = members.filter(member =>
    member.auth_fullname.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered members to put current user first
  const sortedFilteredMembers = filteredMembers.sort((a, b) => {
    const isACurrent = a.user_id === currentUser?.id;
    const isBCurrent = b.user_id === currentUser?.id;
    
    if (isACurrent && !isBCurrent) return -1;
    if (!isACurrent && isBCurrent) return 1;
    return 0;
  });

  // Available items for keyboard navigation
  const availableMembers = sortedFilteredMembers.filter(member => !selectedMemberIds.includes(member.user_id));
  const hasUnassignedOption = !selectedMemberIds.includes('unassigned');
  const totalNavigableItems = (hasUnassignedOption ? 1 : 0) + availableMembers.length;

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!isOpen || isLoading || totalNavigableItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMemberIndex(prev => {
          const next = prev + 1;
          return next >= totalNavigableItems ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMemberIndex(prev => {
          const next = prev - 1;
          return next < 0 ? totalNavigableItems - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedMemberIndex >= 0) {
          if (hasUnassignedOption && selectedMemberIndex === 0) {
            // Select unassigned option
            handleUnassignedToggle();
          } else {
            // Select member
            const memberIndex = hasUnassignedOption ? selectedMemberIndex - 1 : selectedMemberIndex;
            const member = availableMembers[memberIndex];
            if (member) {
              handleMemberToggle(member.user_id);
            }
          }
        }
        break;
      case 'Shift':
        if (e.code !== 'ShiftRight') return;
        if (!isCurrentUserAdmin) return;
        e.preventDefault();
        if (selectedMemberIndex >= 0) {
          if (hasUnassignedOption && selectedMemberIndex === 0) {
            // Skip attendance for unassigned option
            return;
          } else {
            // Toggle attendance for member
            const memberIndex = hasUnassignedOption ? selectedMemberIndex - 1 : selectedMemberIndex;
            const member = availableMembers[memberIndex];
            if (member) {
              handleAttendanceToggle(member.user_id);
            }
          }
        }
        break;
      case 'Escape':
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.focus();
          setSelectedMemberIndex(-1);
        }
        break;
    }
  }, [isOpen, isLoading, selectedMemberIndex, totalNavigableItems, hasUnassignedOption, availableMembers, handleUnassignedToggle, handleMemberToggle, handleAttendanceToggle, isCurrentUserAdmin]);

  // Add keyboard event listener
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isOpen]);

  // Reset selection when search term changes
  React.useEffect(() => {
    setSelectedMemberIndex(-1);
  }, [searchTerm]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedMemberIndex >= 0 && memberListRef.current) {
      const items = memberListRef.current.querySelectorAll('[data-member-item]');
      const selectedItem = items[selectedMemberIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [selectedMemberIndex]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

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
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[100vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white" id="filter-modal-title">Filter by Assignee</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300" id="filter-modal-description">
                {selectedMemberIds.length > 0 ? `${selectedMemberIds.length} selected` : 'Select members to filter cards'}
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
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
                  </div>
                  <div className="w-5 h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Members Display */}
              {selectedMemberIds.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Selected Filters ({selectedMemberIds.length})
                    </h3>
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMemberIds.map((memberId) => {
                      if (memberId === 'unassigned') {
                        return (
                          <div
                            key={memberId}
                            className="relative group"
                            title="Unassigned cards"
                          >
                            <button
                              onClick={handleUnassignedToggle}
                              className="w-10 h-10 bg-gray-400 hover:bg-red-500 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              title="Click to remove unassigned filter"
                            >
                              <User className="h-4 w-4 text-white" />
                            </button>
                            
                            {/* Cross icon to remove filter */}
                            <button
                              onClick={handleUnassignedToggle}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-sm"
                              title="Remove unassigned filter"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        );
                      }
                      
                      const member = members.find(m => m.user_id === memberId);
                      if (!member) return null;
                      
                      return (
                        <div
                          key={memberId}
                          className="relative group"
                          title={member.auth_fullname.fullname}
                        >
                          <button
                            onClick={() => handleMemberToggle(memberId)}
                            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-red-500 hover:to-red-600 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title={`Click to remove ${member.auth_fullname.fullname} filter`}
                          >
                            <span className="text-xs font-bold text-white">
                              {getInitials(member.auth_fullname.fullname)}
                            </span>
                          </button>
                          
                          {/* Cross icon to remove member */}
                          <button
                            onClick={() => handleMemberToggle(memberId)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-sm"
                            title="Remove filter"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <label htmlFor="member-search" className="sr-only">Search members</label>
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
                  autoFocus
                />
              </div>

              

              {/* Unassigned Option */}
              <div>
                {!selectedMemberIds.includes('unassigned') && (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Assignment Status</h3>
                    <button
                      data-member-item
                      onClick={handleUnassignedToggle}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        hasUnassignedOption && selectedMemberIndex === 0
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 border-2 border-transparent'
                      }`}
                      aria-label="Filter by unassigned cards"
                    >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Unassigned</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cards with no assignees</p>
                      </div>
                    </div>
                    
                    <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </button>
                </>
                  )}
              </div>

              {/* Members List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Team Members</h3>
                <div ref={memberListRef} className="space-y-2 max-h-60 overflow-y-auto filter-members-scroll pr-2">
                  {sortedFilteredMembers
                    .filter(member => !selectedMemberIds.includes(member.user_id))
                    .map((member, index) => {
                      const isCurrentUser = member.user_id === currentUser?.id;
                      const displayName = isCurrentUser 
                        ? `${member.auth_fullname.fullname} (Me)` 
                        : member.auth_fullname.fullname;
                      const memberIndex = hasUnassignedOption ? index + 1 : index;
                      const isSelected = selectedMemberIndex === memberIndex;
                      const isMarkedForAttendance = isMarked(member.id);
                      
                      return (
                        <div
                          key={member.user_id}
                          data-member-item
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 border-2 border-transparent'
                          }`}
                        >
                          <button
                            onClick={() => handleMemberToggle(member.user_id)}
                            className="flex items-center space-x-3 flex-1 text-left"
                            aria-label={`Filter by ${displayName}`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                              <span className="text-xs font-bold text-white">
                                {getInitials(member.auth_fullname.fullname)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {displayName}
                              </p>
                            </div>
                          </button>
                          
                          <div className="flex items-center space-x-2">
                            {/* Attendance Button */}
                            {isCurrentUserAdmin && (
                            <button
                              onClick={() => handleAttendanceToggle(member.user_id)}
                              disabled={!isCurrentUserAdmin || toggleLoadingMemberId === member.id}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                                !isCurrentUserAdmin
                                  ? 'cursor-default opacity-75'
                                  : toggleLoadingMemberId === member.id
                                    ? 'cursor-not-allowed opacity-50'
                                  : isMarkedForAttendance 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500'
                              } ${
                                isMarkedForAttendance 
                                  ? 'bg-green-500 text-white' 
                                  : isCurrentUserAdmin
                                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                              }`}
                              title={isCurrentUserAdmin 
                                ? (isMarkedForAttendance ? `${displayName} is present` : `Mark ${displayName} as present`)
                                : `${displayName} is ${isMarkedForAttendance ? 'present' : 'absent'} (Admin required to change)`
                              }
                              aria-label={isCurrentUserAdmin
                                ? `${isMarkedForAttendance ? 'Unmark' : 'Mark'} ${displayName} as present`
                                : `${displayName} is ${isMarkedForAttendance ? 'present' : 'absent'} (View only)`
                              }
                            >
                              {toggleLoadingMemberId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              ) : isMarkedForAttendance ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <div className="w-2 h-2 bg-current rounded-full opacity-50" />
                              )}
                            </button>
                          )}
                            {/* Filter Button */}
                            <button
                              onClick={() => handleMemberToggle(member.user_id)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                              title={`Add ${displayName} to filter`}
                              aria-label={`Filter by ${displayName}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Empty States */}
              {searchTerm && filteredMembers.filter(member => !selectedMemberIds.includes(member.user_id)).length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {filteredMembers.length === 0 
                      ? `No members found for "${searchTerm}"` 
                      : 'All matching members are already selected'
                    }
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Clear search
                  </button>
                </div>
              )}
              
              {!searchTerm && members.filter(member => !selectedMemberIds.includes(member.user_id)).length === 0 && selectedMemberIds.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No members found in this workspace</p>
                </div>
              )}
            </div>
          )}
        {/* Keyboard Navigation Info */}
                  {isCurrentUserAdmin && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-5 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  <span className="font-medium">Navigation:</span> Use arrow keys to navigate <br/>• Press <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-800 dark:text-blue-200 font-mono text-xs">Enter</kbd> to filter
                    <span> • Press <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-800 dark:text-blue-200 font-mono text-xs">Right Shift</kbd> to mark attendance</span>
                </p>
              </div>
              )}
        </div>
      </div>
      
      
    </div>
  );
};

export default FilterMembersModal;