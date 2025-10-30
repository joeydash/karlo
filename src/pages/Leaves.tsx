import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plus, Search, Filter, ChevronDown, FileText, Trash2, X, Clock, CheckCircle, XCircle, AlertCircle, Edit, Settings, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeave } from '../hooks/useLeave';
import { useLeaveType } from '../hooks/useLeaveType';
import { useOrganization } from '../hooks/useOrganization';
import { useMember } from '../hooks/useMember';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import ApplyLeaveModal from '../components/ApplyLeaveModal';
import LeaveDetailsModal from '../components/LeaveDetailsModal';
import EditLeaveModal from '../components/EditLeaveModal';
import LeaveRulesModal from '../components/LeaveRulesModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SideNavigation from '../components/SideNavigation';
import { Leave } from '../types/leave';
import { Member } from '../types/member';

const Leaves: React.FC = () => {
  const navigate = useNavigate();
  const { leaves, userJoiningDate, selectedMemberJoiningDate, isLoading, error, totalCount, currentPage, itemsPerPage, fetchLeaves, fetchMemberLeaves, fetchAllLeaves, deleteLeave, approveLeave, rejectLeave, setPage, setItemsPerPage: setStoreItemsPerPage } = useLeave();
  const { leaveTypes } = useLeaveType();
  const { currentOrganization } = useOrganization();
  const { members } = useMember();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayPartFilter, setDayPartFilter] = useState<'all' | 'full_day' | 'first_half' | 'second_half'>('all');
  const [showDayPartDropdown, setShowDayPartDropdown] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    // Default to current user's ID when page loads
    return currentUser?.id || '';
  });
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Check if current user is admin
  const isCurrentUserAdmin = currentOrganization?.user_role === 'admin';

  // Effect to fetch appropriate leaves based on admin selection and pagination
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const offset = (currentPage - 1) * itemsPerPage;

    if (isCurrentUserAdmin) {
      if (selectedMemberId === '') {
        // Admin viewing all members
        fetchAllLeaves(currentOrganization.id, itemsPerPage, offset);
      } else if (selectedMemberId && selectedMemberId !== currentUser?.id) {
        // Admin viewing specific member
        fetchMemberLeaves(currentOrganization.id, selectedMemberId, itemsPerPage, offset);
      } else {
        // Admin viewing their own leaves
        fetchLeaves(currentOrganization.id, itemsPerPage, offset);
      }
    } else {
      // Regular user viewing their own leaves
      fetchLeaves(currentOrganization.id, itemsPerPage, offset);
    }
  }, [currentOrganization?.id, selectedMemberId, currentPage, itemsPerPage]);

  const handleDeleteLeave = (leaveId: string) => {
    setLeaveToDelete(leaveId);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteLeave = async () => {
    if (!leaveToDelete) return;

    const result = await deleteLeave(leaveToDelete);
    if (result.success) {
      showSuccess('Leave request deleted successfully');
    } else {
      showError(result.message || 'Failed to delete leave');
    }
    setShowConfirmDeleteModal(false);
    setLeaveToDelete(null);
  };

  const handleApproveLeave = async (leaveId: string) => {
    const result = await approveLeave(leaveId);
    if (result.success) {
      showSuccess('Leave request approved successfully');
    } else {
      showError(result.message || 'Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    const result = await rejectLeave(leaveId);
    if (result.success) {
      showSuccess('Leave request rejected');
    } else {
      showError(result.message || 'Failed to reject leave');
    }
  };

  const handleLeaveDetails = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const handleEditLeave = (leave: Leave) => {
    setSelectedLeave(leave);
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayPartLabel = (dayPart: string) => {
    switch (dayPart) {
      case 'full_day':
        return 'Full Day';
      case 'first_half':
        return 'First Half';
      case 'second_half':
        return 'Second Half';
      default:
        return dayPart;
    }
  };

  const getDayPartColor = (dayPart: string) => {
    switch (dayPart) {
      case 'full_day':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'first_half':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'second_half':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  // Filter leaves based on search term (leave type only), day part, month, and year
  // Note: Filtering is done on frontend for now, consider moving to backend for better performance
  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch =
      leave.karlo_leave_type?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;

    const matchesDayPart = dayPartFilter === 'all' || leave.day_part === dayPartFilter;

    // Month and year filtering
    const leaveDate = new Date(leave.leave_date);
    const leaveMonth = leaveDate.getMonth(); // 0-11
    const leaveYear = leaveDate.getFullYear();

    const matchesMonth = selectedMonth === 'all' || leaveMonth === parseInt(selectedMonth);
    const matchesYear = selectedYear === 'all' || leaveYear === parseInt(selectedYear);

    return matchesSearch && matchesDayPart && matchesMonth && matchesYear;
  });

  // Use filtered leaves for display
  const paginatedLeaves = filteredLeaves;

  // Pagination calculations - using server-side pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, dayPartFilter, selectedMemberId, selectedMonth, selectedYear]);

  // Calculate leave statistics
  // Filter leaves for the selected member (for admins) or current user
  const memberLeaves = isCurrentUserAdmin && selectedMemberId 
    ? leaves.filter(leave => leave.user_id === selectedMemberId)
    : leaves.filter(leave => leave.user_id === (currentUser?.id || ''));
    
  const totalLeaves = memberLeaves.length;
  const fullDayLeaves = memberLeaves.filter(leave => leave.day_part === 'full_day').length;
  const halfDayLeaves = memberLeaves.filter(leave => leave.day_part === 'first_half' || leave.day_part === 'second_half').length;

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member.auth_fullname.fullname.toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  // Calculate user's leave balances
  const calculateLeaveBalances = () => {
    // Get the target user's joining date (selected member for admin, current user otherwise)
    let targetUserJoiningDate = userJoiningDate;
    
    if (isCurrentUserAdmin && selectedMemberId && selectedMemberId !== currentUser?.id) {
      // For admin viewing another member's data, we need to get that member's joining date
      const selectedMember = members.find(m => m.user_id === selectedMemberId);
      targetUserJoiningDate = selectedMember?.joining_date || selectedMember?.created_at || null;
    }
    
    // Calculate prorated allowance based on joining date
    const calculateProratedAllowance = (annualAllowance: number) => {
      if (!targetUserJoiningDate) {
        return annualAllowance; // If no joining date, use full allowance
      }
      
      const joiningDate = new Date(targetUserJoiningDate);
      const currentDate = new Date(); // Today's date
      const millisecondsInDay = 1000 * 60 * 60 * 24;
      const currentYear = new Date().getFullYear();
      
      if (joiningDate.getFullYear() < currentYear) {
        // Calculate from start of current year to today
        const yearStart = new Date(currentYear, 0, 1); // January 1st of current year
        const millisecondsInDay = 1000 * 60 * 60 * 24;
        const daysFromYearStartToToday = Math.floor((currentDate.getTime() - yearStart.getTime()) / millisecondsInDay) + 1;
        
        // Formula: (days from year start to today) ÷ 365 × annual allowance
        const proratedAllowance = Math.floor((daysFromYearStartToToday / 365) * annualAllowance);
        
        return Math.max(0, proratedAllowance);
      }
      
      // Always calculate from joining date to today, regardless of year
      const daysFromJoiningToToday = Math.floor((currentDate.getTime() - joiningDate.getTime()) / millisecondsInDay) + 1;
      
      // Formula: (days from joining to today) ÷ 365 × annual allowance
      const proratedAllowance = Math.floor((daysFromJoiningToToday / 365) * annualAllowance);
    
      
      return Math.max(0, proratedAllowance); // Ensure non-negative
    };
    
    return leaveTypes.map(leaveType => {
      const typeLeaves = memberLeaves.filter(leave => leave.leave_type_id === leaveType.id);
      // Count full days as 1, half days as 0.5
      const usedDays = typeLeaves.reduce((sum, leave) => {
        return sum + (leave.day_part === 'full_day' ? 1 : 0.5);
      }, 0);
      
      const proratedAllowance = calculateProratedAllowance(leaveType.allowance_days);
      
      return {
        leave_type_id: leaveType.id,
        type_code: leaveType.type_code,
        display_name: leaveType.display_name,
        allowance_days: proratedAllowance,
        annual_allowance: leaveType.allowance_days,
        used_days: usedDays,
        available_days: Math.max(0, proratedAllowance - usedDays),
        is_prorated: targetUserJoiningDate !== null // Always show as prorated if we have a joining date
      };
    });
  };

  const leaveBalances = calculateLeaveBalances();

  const dayPartOptions = [
    { value: 'all', label: 'All Day Parts', count: memberLeaves.length },
    { value: 'full_day', label: 'Full Day', count: fullDayLeaves },
    { value: 'first_half', label: 'First Half', count: memberLeaves.filter(l => l.day_part === 'first_half').length },
    { value: 'second_half', label: 'Second Half', count: memberLeaves.filter(l => l.day_part === 'second_half').length }
  ];

  // Generate month options
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' }
  ];

  // Generate year options from leaves data
  const availableYears = Array.from(new Set(leaves.map(leave => new Date(leave.leave_date).getFullYear())))
    .sort((a, b) => b - a); // Sort descending (newest first)

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map(year => ({ value: year.toString(), label: year.toString() }))
  ];

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-8 w-16 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center py-3 sm:py-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">My Leaves</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load your leaves</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideNavigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Leaves & Holidays</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Manage leaves, holidays, and office hours</p>
                </div>
              </div>
            </div>

            {/* Holidays, OOTOH Navigation Buttons, and Admin Member Selection */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/holidays')}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Holidays</span>
                <span className="sm:hidden">Holidays</span>
              </button>
              <button
                onClick={() => navigate('/ootoh')}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Out Of The Office Hours</span>
                <span className="sm:hidden">OOTOH</span>
              </button>

              {/* Admin Member Selection Dropdown */}
              {isCurrentUserAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    className="flex items-center justify-between sm:justify-start space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                  >
                    <Users className="h-4 w-4" />
                    <span>
                      {selectedMemberId
                        ? (() => {
                          if (selectedMemberId === '') {
                            return 'All Members';
                          }
                            const member = members.find(m => m.user_id === selectedMemberId);
                            if (!member) return 'Select Member';
                            const isCurrentUser = member.user_id === currentUser?.id;
                            return isCurrentUser ? `${member.auth_fullname.fullname} (Me)` : member.auth_fullname.fullname;
                          })()
                        : 'All Members'
                      }
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                
                {showMemberDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 max-h-60 overflow-y-auto">
                    {/* Search Input */}
                    <div className="px-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          autoFocus
                        />
                        {memberSearchTerm && (
                          <button
                            onClick={() => setMemberSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Individual Members */}
                    {filteredMembers.map((member) => (
                      <button
                        key={member.user_id}
                        onClick={() => {
                          setSelectedMemberId(member.user_id);
                          setShowMemberDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          selectedMemberId === member.user_id ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {member.auth_fullname.dp ? (
                            <img
                              src={member.auth_fullname.dp}
                              alt={member.auth_fullname.fullname}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-100"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                              <span className="text-xs font-bold text-white">
                                {member.auth_fullname.fullname
                                  .split(' ')
                                  .map(name => name.charAt(0))
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.auth_fullname.fullname}
                            {member.user_id === currentUser?.id && ' (Me)'}
                          </p>
                        </div>
                        {selectedMemberId === member.user_id && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                    
                    {/* All Members Option for Admin */}
                    {(!memberSearchTerm || 'all members'.includes(memberSearchTerm.toLowerCase())) && (
                      <button
                      onClick={() => {
                        setSelectedMemberId('');
                        setShowMemberDropdown(false);
                        setMemberSearchTerm('');
                        setMemberSearchTerm('');
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border-t border-gray-200 dark:border-gray-600 ${
                        selectedMemberId === '' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          All Members
                        </p>
                      </div>
                      {selectedMemberId === '' && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                      </button>
                    )}
                    
                    {/* No Results Message */}
                    {memberSearchTerm && filteredMembers.length === 0 && !('all members'.includes(memberSearchTerm.toLowerCase())) && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-600">
                        No members found for "{memberSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Leave Balance Cards */}
        {leaveBalances.length > 0 && (!isCurrentUserAdmin || (isCurrentUserAdmin && selectedMemberId && selectedMemberId !== '')) && (
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {/* Joining Date Info */}
            {(() => {
              const displayJoiningDate = isCurrentUserAdmin && selectedMemberId && selectedMemberId !== currentUser?.id 
                ? selectedMemberJoiningDate 
                : userJoiningDate;
              
              return displayJoiningDate && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-100">Organization Joining Date</h3>
                      <p className="text-blue-700 dark:text-blue-300">
                        {formatDate(displayJoiningDate)}
                        {new Date(displayJoiningDate).getFullYear() === new Date().getFullYear() && (
                          <span className="ml-0 sm:ml-2 block sm:inline mt-1 sm:mt-0 text-sm bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded-full w-fit">
                            Prorated allowances applied
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setShowRulesModal(true)}
                      className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-sm"
                    >
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Leave Rules</span>
                      <span className="sm:hidden">Rules</span>
                    </button>
                    {isCurrentUserAdmin && (
                      <button
                        onClick={() => navigate('/leave-settings')}
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 dark:hover:bg-purple-700 rounded-xl transition-all duration-200 shadow-sm"
                      >
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Leave Settings</span>
                        <span className="sm:hidden">Settings</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg flex-1 sm:flex-initial justify-center"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Apply for Leave</span>
                      <span className="sm:hidden">Apply</span>
                    </button>
                  </div>
                </div>
              </div>
              );
            })()}
            
            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {leaveBalances.map((balance) => (
                <div key={balance.leave_type_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{balance.display_name}</h3>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Available</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">{balance.available_days}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Used</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{balance.used_days}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {balance.is_prorated ? 'Prorated' : 'Total'}
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{balance.allowance_days}</span>
                    </div>
                    {balance.is_prorated && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                        Annual: {balance.annual_allowance} days
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {(!isCurrentUserAdmin || (isCurrentUserAdmin && selectedMemberId && selectedMemberId !== '')) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLeaves}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fullDayLeaves}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Half Days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{halfDayLeaves}</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Filters Section - Always visible when leaves exist */}
        {!isLoading && leaves.length > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  if (isCurrentUserAdmin && selectedMemberId === '') {
                    return 'All Leave Requests';
                  } else if (isCurrentUserAdmin && selectedMemberId && selectedMemberId !== currentUser?.id) {
                    const member = members.find(m => m.user_id === selectedMemberId);
                    return `${member?.auth_fullname.fullname || 'Member'}'s Leave History`;
                  } else {
                    return 'My Leave History';
                  }
                })()}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {searchTerm || selectedMonth !== 'all' || selectedYear !== 'all' || dayPartFilter !== 'all' ? (
                  <>
                    {filteredLeaves.length} of {leaves.length} leave{leaves.length !== 1 ? 's' : ''}
                    {filteredLeaves.length > 0 && searchTerm && ` matching "${searchTerm}"`}
                    {selectedMonth !== 'all' && ` in ${monthOptions.find(m => m.value === selectedMonth)?.label}`}
                    {selectedYear !== 'all' && ` for year ${selectedYear}`}
                    {dayPartFilter !== 'all' && ` with day part "${getDayPartLabel(dayPartFilter)}"`}
                  </>
                ) : (
                  (() => {
                    if (isCurrentUserAdmin && selectedMemberId === '') {
                      return `${leaves.length} leave request${leaves.length !== 1 ? 's' : ''} (all members)`;
                    } else if (isCurrentUserAdmin && selectedMemberId && selectedMemberId !== currentUser?.id) {
                      const member = members.find(m => m.user_id === selectedMemberId);
                      return `${leaves.length} leave request${leaves.length !== 1 ? 's' : ''} (${member?.auth_fullname.fullname || 'Unknown Member'})`;
                    } else {
                      return `${leaves.length} leave request${leaves.length !== 1 ? 's' : ''}`;
                    }
                  })()
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:flex-shrink-0">
              {/* Month Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false);
                    setShowDayPartDropdown(false);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showMonthDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 max-h-56 overflow-y-auto custom-scrollbar">
                    {monthOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedMonth(option.value);
                          setShowMonthDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          selectedMonth === option.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{option.label}</span>
                        {selectedMonth === option.value && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false);
                    setShowDayPartDropdown(false);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{yearOptions.find(opt => opt.value === selectedYear)?.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showYearDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 max-h-56 overflow-y-auto custom-scrollbar">
                    {yearOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedYear(option.value);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          selectedYear === option.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{option.label}</span>
                        {selectedYear === option.value && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Day Part Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDayPartDropdown(!showDayPartDropdown);
                    setShowMonthDropdown(false);
                    setShowYearDropdown(false);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Filter className="h-4 w-4" />
                  <span>{dayPartOptions.find(opt => opt.value === dayPartFilter)?.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showDayPartDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 custom-scrollbar">
                    {dayPartOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDayPartFilter(option.value as any);
                          setShowDayPartDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          dayPartFilter === option.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({option.count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Input - for leave types only */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Day Part</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <ShimmerRow key={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No leave requests yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Apply for your first leave to get started</p>
            <button 
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No leaves found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No leaves match your current filters
              {searchTerm && ` for "${searchTerm}"`}
              {selectedMonth !== 'all' && ` in ${monthOptions.find(m => m.value === selectedMonth)?.label}`}
              {selectedYear !== 'all' && ` for year ${selectedYear}`}
              {dayPartFilter !== 'all' && ` with day part "${getDayPartLabel(dayPartFilter)}"`}
            </p>
            <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Search</span>
                </button>
              )}
              {selectedMonth !== 'all' && (
                <button
                  onClick={() => setSelectedMonth('all')}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Month</span>
                </button>
              )}
              {selectedYear !== 'all' && (
                <button
                  onClick={() => setSelectedYear('all')}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Year</span>
                </button>
              )}
              {dayPartFilter !== 'all' && (
                <button
                  onClick={() => setDayPartFilter('all')}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                >
                  <Filter className="h-4 w-4" />
                  <span>Clear Day Part</span>
                </button>
              )}
              {(searchTerm || selectedMonth !== 'all' || selectedYear !== 'all' || dayPartFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedMonth('all');
                    setSelectedYear('all');
                    setDayPartFilter('all');
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                        Leave Type
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                        Day Part
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {leave.karlo_leave_type?.display_name || 'Unknown Leave Type'}
                              </div>
                              {/* Show employee name for admin viewing all leaves */}
                              {isCurrentUserAdmin && selectedMemberId === '' && leave.auth_fullname && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {leave.auth_fullname.fullname}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {leave.karlo_leave_type?.allowance_days || 0} days allowed
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(leave.leave_date)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Applied {formatDate(leave.created_at)}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDayPartColor(leave.day_part)}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {getDayPartLabel(leave.day_part)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(leave.status || 'pending')}`}>
                            {getStatusIcon(leave.status || 'pending')}
                            <span className="ml-1">{getStatusLabel(leave.status || 'pending')}</span>
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* Admin Actions for Pending Requests */}
                            {isCurrentUserAdmin && (leave.status === 'pending' || !leave.status) && (
                              <>
                                <button
                                  onClick={() => handleApproveLeave(leave.id)}
                                  className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded-lg transition-all duration-200"
                                  title="Approve leave request"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectLeave(leave.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                                  title="Reject leave request"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            
                            {/* User Actions for Own Pending Requests */}
                            {(leave.status === 'pending' || !leave.status) && (leave.user_id === currentUser?.id || isCurrentUserAdmin) && (
                              <>
                                <button
                                  onClick={() => handleEditLeave(leave)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all duration-200"
                                  title="Edit leave request"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLeave(leave.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                                  title="Delete leave request"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredLeaves.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(endIndex, totalCount)}</span> of{' '}
                      <span className="font-semibold">{totalCount}</span> results
                    </span>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="itemsPerPage" className="text-sm text-gray-700 dark:text-gray-300">
                        Per page:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setStoreItemsPerPage(Number(e.target.value));
                        }}
                        className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {(() => {
                        const pages = [];
                        const maxVisiblePages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                        if (endPage - startPage < maxVisiblePages - 1) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => setPage(1)}
                              className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            );
                          }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                currentPage === i
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md'
                                  : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => setPage(totalPages)}
                              className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedLeaves.map((leave) => (
                <div key={leave.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {leave.karlo_leave_type?.display_name || 'Unknown Leave Type'}
                        </h3>
                        {isCurrentUserAdmin && selectedMemberId === '' && leave.auth_fullname && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {leave.auth_fullname.fullname}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusColor(leave.status || 'pending')}`}>
                      {getStatusIcon(leave.status || 'pending')}
                      <span className="ml-1">{getStatusLabel(leave.status || 'pending')}</span>
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Leave Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(leave.leave_date)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Day Part</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDayPartColor(leave.day_part)}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {getDayPartLabel(leave.day_part)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Applied On</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(leave.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Allowance</span>
                      <span className="font-medium text-gray-900 dark:text-white">{leave.karlo_leave_type?.allowance_days || 0} days</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {((leave.status === 'pending' || !leave.status) && (leave.user_id === currentUser?.id || isCurrentUserAdmin)) && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {isCurrentUserAdmin && (
                        <>
                          <button
                            onClick={() => handleApproveLeave(leave.id)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave.id)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEditLeave(leave)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLeave(leave.id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Pagination */}
              {filteredLeaves.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                    <span>
                      {startIndex + 1}-{Math.min(endIndex, filteredLeaves.length)} of {filteredLeaves.length}
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setStoreItemsPerPage(Number(e.target.value));
                      }}
                      className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5/page</option>
                      <option value={10}>10/page</option>
                      <option value={20}>20/page</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {showDayPartDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDayPartDropdown(false)}
        />
      )}

      {showMonthDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMonthDropdown(false)}
        />
      )}

      {showYearDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowYearDropdown(false)}
        />
      )}

      {/* Click outside to close member dropdown */}
      {showMemberDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowMemberDropdown(false);
            setMemberSearchTerm('');
          }}
        />
      )}
      
      <ApplyLeaveModal 
        isOpen={showApplyModal} 
        onClose={() => setShowApplyModal(false)}
        selectedMemberId={selectedMemberId}
      />
      
      <LeaveDetailsModal 
        isOpen={showDetailsModal} 
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
      />
      
      <EditLeaveModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
      />
      
      <LeaveRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        leaveTypes={leaveTypes}
        userJoiningDate={userJoiningDate}
      />

      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => {
          setShowConfirmDeleteModal(false);
          setLeaveToDelete(null);
        }}
        onConfirm={confirmDeleteLeave}
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isLoading}
      />
    </div>
    </>
  );
};

export default Leaves;