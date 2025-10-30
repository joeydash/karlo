import React, { useState, useEffect } from 'react';
import { X, Users, Check, User, Search, UserCheck, UserX, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { useKanban } from '../../hooks/useKanban';
import { useMember } from '../../hooks/useMember';
import { useOrganization } from '../../hooks/useOrganization';
import { useAuth } from '../../hooks/useAuth';
import { useAttendance } from '../../hooks/useAttendance';
import { useFocusManagement } from '../../hooks/useKeyboardNavigation';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../ConfirmationModal';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

type FilterType = 'all' | 'attended' | 'unattended';

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  boardId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number>(-1);
  const [attendanceFilter, setAttendanceFilter] = useState<FilterType>('all');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [toggleLoadingMemberId, setToggleLoadingMemberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date
    return new Date().toISOString().split('T')[0];
  });
  const { members } = useMember();
  const { currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const { showSuccess, showWarning } = useToast();
  const { 
    isMarked, 
    toggleAttendance,
    getMarkedMemberIds, 
    clearAttendance, 
    fetchAttendanceForDate,
    isLoading: isAttendanceLoading 
  } = useAttendance();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const memberListRef = React.useRef<HTMLDivElement>(null);

  // Check if current user is admin - get from member store
  const currentUserMember = members.find(member => member.user_id === currentUser?.id);
  const isCurrentUserAdmin = currentUserMember?.role === 'admin';
  
  // Focus management for modal
  useFocusManagement(isOpen, searchInputRef);

  // Fetch attendance data when modal opens
  useEffect(() => {
    if (isOpen && members.length > 0 && selectedDate) {
      const memberIds = members.map(member => member.id);
      fetchAttendanceForDate(memberIds, selectedDate);
    }
  }, [isOpen, members, selectedDate, fetchAttendanceForDate]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (members.length > 0) {
      const memberIds = members.map(member => member.id);
      fetchAttendanceForDate(memberIds, newDate);
    }
  };
  const handleMemberToggle = async (userId: string) => {
    if (!isCurrentUserAdmin) {
      showWarning('Access Denied', 'Only administrators can mark attendance');
      return;
    }

    // Find the member record by user_id to get member_id
    const member = members.find(m => m.user_id === userId);
    if (!member?.id) {
      console.error('Member not found for user:', userId);
      return;
    }
    
    setToggleLoadingMemberId(member.id);
    const result = await toggleAttendance(member.id, selectedDate);
    setToggleLoadingMemberId(null);
    
    if (!result.success) {
      console.error('Failed to toggle attendance:', result.message);
      showWarning('Update failed', result.message || 'Failed to update attendance');
    }
  };

  const handleClearAll = () => {
    if (!isCurrentUserAdmin) {
      showWarning('Access Denied', 'Only administrators can clear attendance');
      return;
    }
    setShowClearConfirmation(true);
  };

  const confirmClearAll = async () => {
    const memberIds = members.map(m => m.id);
    const markedMembers = getMarkedMemberIds();
    const clearedCount = markedMembers.size;
    
    const result = await clearAttendance(memberIds, selectedDate);
    setShowClearConfirmation(false);
    
    if (result.success) {
      showSuccess(
        'Attendance Cleared', 
        `Successfully cleared attendance for ${clearedCount} member${clearedCount !== 1 ? 's' : ''}`
      );
    } else {
      showWarning('Clear failed', result.message || 'Failed to clear attendance');
    }
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.auth_fullname.fullname.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (attendanceFilter === 'all') {
      return matchesSearch;
    } else if (attendanceFilter === 'attended') {
      return matchesSearch && isMarked(member.id);
    } else if (attendanceFilter === 'unattended') {
      return matchesSearch && !isMarked(member.id);
    }
    
    return matchesSearch;
  });

  // Sort filtered members to put current user first
  const sortedFilteredMembers = filteredMembers.sort((a, b) => {
    const isACurrent = a.user_id === currentUser?.id;
    const isBCurrent = b.user_id === currentUser?.id;
    
    if (isACurrent && !isBCurrent) return -1;
    if (!isACurrent && isBCurrent) return 1;
    return 0;
  });

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (!isOpen || isLoading || sortedFilteredMembers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMemberIndex(prev => {
          const next = prev + 1;
          return next >= sortedFilteredMembers.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMemberIndex(prev => {
          const next = prev - 1;
          return next < 0 ? sortedFilteredMembers.length - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedMemberIndex >= 0) {
          const member = sortedFilteredMembers[selectedMemberIndex];
          if (member) {
            handleMemberToggle(member.user_id);
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
  }, [isOpen, isLoading, selectedMemberIndex, sortedFilteredMembers, handleMemberToggle, isCurrentUserAdmin]);

  // Add keyboard event listener
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, isOpen]);

  // Reset selection when search term or filter changes
  React.useEffect(() => {
    setSelectedMemberIndex(-1);
  }, [searchTerm, attendanceFilter]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedMemberIndex >= 0 && memberListRef.current) {
      const items = memberListRef.current.querySelectorAll('[data-member-item]');
      const selectedItem = items[selectedMemberIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedMemberIndex]);

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchTerm('');
    setSelectedMemberIndex(-1);
    onClose();
  };

  const filterButtons = [
    { 
      key: 'all', 
      label: 'All', 
      icon: Users, 
      count: members.length,
      color: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    },
    { 
      key: 'attended', 
      label: 'Attended', 
      icon: UserCheck, 
      count: getMarkedMemberIds().size,
      color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
    },
    { 
      key: 'unattended', 
      label: 'Unattended', 
      icon: UserX, 
      count: members.length - getMarkedMemberIds().size,
      color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
    }
  ];

  const activeFilterButton = filterButtons.find(btn => btn.key === attendanceFilter);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
      aria-describedby="attendance-modal-description"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-[62vh] w-full max-h-[100vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white" id="attendance-modal-title">Mark Attendance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center space-x-2" id="attendance-modal-description">
                <span>{formatDisplayDate(selectedDate)}</span>
                <span>•</span>
                <span>{getMarkedMemberIds().size} of {members.length} members marked</span>
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
          {/* Date Selection */}
          <div className="mb-6">
            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              style={{
                colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }}
            />
          </div>

          {isLoading || isAttendanceLoading ? (
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
              {/* Filter Buttons */}
              <div className="flex flex-wrap justify-center pb-2 gap-2">
                {filterButtons.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setAttendanceFilter(filter.key as FilterType)}
                    className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      attendanceFilter === filter.key
                        ? `${filter.color} ring-2 ring-blue-500 ring-opacity-50`
                        : filter.color
                    }`}
                  >
                    <filter.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.label.slice(0, 3)}</span>
                    <span className="bg-white dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 rounded-full text-xs">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search and Clear Section */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
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
                {isCurrentUserAdmin && getMarkedMemberIds().size > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 whitespace-nowrap"
                    title="Clear all markings"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              
              {/* Members List */}
              <div>
                <div ref={memberListRef} className="space-y-2 max-h-60 overflow-y-auto attendance-modal-scroll pr-2">
                  {sortedFilteredMembers.map((member, index) => {
                    const isCurrentUser = member.user_id === currentUser?.id;
                    const displayName = isCurrentUser 
                      ? `${member.auth_fullname.fullname} (Me)` 
                      : member.auth_fullname.fullname;
                    const isSelected = selectedMemberIndex === index;
                    const isMarkedForAttendance = isMarked(member.id);
                    
                    return (
                      <button
                        key={member.user_id}
                        data-member-item
                        onClick={() => handleMemberToggle(member.user_id)}
                        disabled={!isCurrentUserAdmin}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          !isCurrentUserAdmin
                            ? 'cursor-default opacity-75'
                            : isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 border-2 border-transparent'
                        } ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500'
                            : isCurrentUserAdmin 
                              ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 focus:bg-gray-100 dark:focus:bg-gray-600 border-2 border-transparent'
                              : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                        }`}
                        aria-label={isCurrentUserAdmin 
                          ? `${isMarkedForAttendance ? 'Unmark' : 'Mark'} ${displayName} as ${isMarkedForAttendance ? 'absent' : 'present'}`
                          : `${displayName} is ${isMarkedForAttendance ? 'present' : 'absent'} (View only)`
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100">
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
                                Last active: {new Date(member.auth_fullname.last_active).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isMarkedForAttendance 
                            ? 'bg-green-500 text-white' 
                            : isCurrentUserAdmin
                              ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-500'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                        }`}>
                          {toggleLoadingMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          ) : isMarkedForAttendance ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <div className="w-2 h-2 bg-current rounded-full opacity-50" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Keyboard Navigation Info */}
                  {isCurrentUserAdmin && (
              <div className="bg-blue-50 dark:bg-blue-900/20 mt-5 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  <span className="font-medium">Navigation:</span> Use arrow keys to navigate • Press <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-800 dark:text-blue-200 font-mono text-xs">Enter</kbd> to mark
                </p>
              </div>
                  )}
              </div>

              {/* Empty States */}
              {searchTerm && sortedFilteredMembers.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No members found for "{searchTerm}"</p>
                </div>
              )}
              {!searchTerm && sortedFilteredMembers.length === 0 && attendanceFilter !== 'all' && !isLoading && (
                <div className="text-center py-8">
                  {activeFilterButton && <activeFilterButton.icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />}
                  <p className="text-gray-500 dark:text-gray-400">
                    No {attendanceFilter} members
                  </p>
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Show all members
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Keyboard navigation help */}
      {sortedFilteredMembers.length > 0 && (
        <div className="sr-only" aria-live="polite">
          Use arrow keys to navigate{isCurrentUserAdmin ? ', Enter to mark/unmark' : ' (view only)'}, Escape to return to search
          {selectedMemberIndex >= 0 && (
            <>
              . Currently highlighting: {sortedFilteredMembers[selectedMemberIndex]?.auth_fullname?.fullname || 'Unknown'}
            </>
          )}
        </div>
      )}
      
      {/* Clear Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirmation}
        onClose={() => setShowClearConfirmation(false)}
        onConfirm={confirmClearAll}
        title="Clear All Attendance"
        message={`Are you sure you want to clear all attendance markings? This will unmark all ${getMarkedMemberIds().size} member${getMarkedMemberIds().size !== 1 ? 's' : ''}. This action cannot be undone.`}
        confirmText="Clear All"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default AttendanceModal;