import React from 'react';
import { ArrowLeft, Users, UserPlus, Calendar, Clock, User, X, Trash2, Edit, Search, Copy, Network, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMember } from '../hooks/useMember';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import InviteMemberModal from '../components/InviteMemberModal';
import EditMemberModal from '../components/EditMemberModal';
import MemberTeamsModal from '../components/MemberTeamsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SideNavigation from '../components/SideNavigation';

const Members: React.FC = () => {
  const navigate = useNavigate();
  const { members, isLoading, error, deleteMember } = useMember();
  const { currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = React.useState(false);
  const [showTeamsModal, setShowTeamsModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [copiedMemberId, setCopiedMemberId] = React.useState<string | null>(null);

  const handleDeleteMember = (member: any) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember) return;

    const result = await deleteMember(selectedMember.id);
    setShowDeleteModal(false);
    setSelectedMember(null);

    if (result.success) {
      showSuccess('Member removed successfully');
    } else {
      showError(result.message || 'Failed to remove member');
    }
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setShowEditMemberModal(true);
  };

  const handleViewTeams = (member: any) => {
    setSelectedMember(member);
    setShowTeamsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const lastActive = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member.auth_fullname.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Divide members into already joined and joining soon
  const currentDate = new Date();
  const alreadyJoinedMembers = filteredMembers.filter(member => {
    const joiningDate = new Date(member.joining_date || member.created_at);
    return joiningDate <= currentDate;
  });
  
  const joiningSoonMembers = filteredMembers.filter(member => {
    const joiningDate = new Date(member.joining_date || member.created_at);
    return joiningDate > currentDate;
  });

  const handleCopyMemberId = async (memberId: string) => {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopiedMemberId(memberId);
      setTimeout(() => setCopiedMemberId(null), 1500);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = memberId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedMemberId(memberId);
      setTimeout(() => setCopiedMemberId(null), 1500);
    }
  };

  // Check if current user is admin in the current organization
  const isCurrentUserAdmin = currentOrganization?.user_role === 'admin';
  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-8 w-8 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between py-3 sm:py-4 gap-3">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Members</h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">{currentOrganization?.display_name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/teams')}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Teams</span>
                </button>
                <button
                  onClick={() => navigate('/org-chart')}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Network className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Org Chart</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load members</h3>
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
          <div className="flex items-center justify-between py-3 sm:py-4 gap-3">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Members</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/teams')}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Teams</span>
              </button>
              <button
                onClick={() => navigate('/org-chart')}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
              >
                <Network className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Org Chart</span>
              </button>
              <button
                onClick={() => navigate('/expenses')}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
              >
                <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Expenses</span>
              </button>
              {isCurrentUserAdmin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Invite Member</span>
                  <span className="sm:hidden">Invite</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header with Search - Always visible when not loading */}
          {!isLoading && members.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{currentOrganization?.display_name} Members</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {searchTerm ? (
                    <>
                      {filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
                      {filteredMembers.length > 0 && ` matching "${searchTerm}"`}
                    </>
                  ) : (
                    `${alreadyJoinedMembers.length} active, ${joiningSoonMembers.length} joining soon`
                  )}
                </p>
              </div>
              <div className="flex items-center w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:flex-initial">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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

          {/* Content Area */}
          {isLoading ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User ID</th>
                      {isCurrentUserAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <ShimmerRow key={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : filteredMembers.length === 0 && !searchTerm ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Invite team members to collaborate on your workspace</p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite Your First Member</span>
              </button>
            </div>
          ) : filteredMembers.length === 0 && searchTerm ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">No members match "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span>Clear Search</span>
              </button>
            </div>
          ) : (
            <>
              {/* Already Joined Members */}
              {alreadyJoinedMembers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 dark:text-green-300 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Already Joined
                    <span className="ml-2 text-xs sm:text-sm font-normal text-green-600 dark:text-green-400">
                      ({alreadyJoinedMembers.length})
                    </span>
                  </h3>
                </div>

                {/* Desktop Table View */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User ID</th>
                      {isCurrentUserAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {alreadyJoinedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {member.auth_fullname.dp ? (
                              <img
                                src={member.auth_fullname.dp}
                                alt={member.auth_fullname.fullname}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                                <span className="text-sm font-bold text-white">
                                  {getInitials(member.auth_fullname.fullname)}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.auth_fullname.fullname}
                                {member.user_id === currentUser?.id && ' (Me)'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              formatLastActive(member.auth_fullname.last_active) === 'Active now' 
                                ? 'bg-green-400' 
                                : 'bg-gray-400'
                            }`}></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {formatLastActive(member.auth_fullname.last_active)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(member.joining_date || member.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyMemberId(member.user_id)}
                            className="group flex items-center space-x-1 text-sm font-mono text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                            title={`Click to copy: ${member.user_id}`}
                          >
                            {copiedMemberId === member.user_id ? (
                              <span className="text-green-600">Copied!</span>
                            ) : (
                              <>
                                <span>{member.user_id.slice(0, 8)}...</span>
                              </>
                            )}
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </button>
                        </td>
                        {isCurrentUserAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewTeams(member)}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2 rounded-lg transition-all duration-200"
                                title="Manage teams"
                              >
                                <Users className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all duration-200"
                                title="Edit member"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                                title="Remove member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {alreadyJoinedMembers.map((member) => (
                    <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      {/* Member Info */}
                      <div className="flex items-start space-x-3 mb-3">
                        {member.auth_fullname.dp ? (
                          <img
                            src={member.auth_fullname.dp}
                            alt={member.auth_fullname.fullname}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-gray-600 flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {getInitials(member.auth_fullname.fullname)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.auth_fullname.fullname}
                            {member.user_id === currentUser?.id && ' (Me)'}
                          </h4>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              formatLastActive(member.auth_fullname.last_active) === 'Active now'
                                ? 'bg-green-400'
                                : 'bg-gray-400'
                            }`}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {formatLastActive(member.auth_fullname.last_active)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Member Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Joined</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {formatDate(member.joining_date || member.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">User ID</span>
                          <button
                            onClick={() => handleCopyMemberId(member.user_id)}
                            className="flex items-center space-x-1 font-mono text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {copiedMemberId === member.user_id ? (
                              <span className="text-green-600">Copied!</span>
                            ) : (
                              <>
                                <span>{member.user_id.slice(0, 8)}...</span>
                                <Copy className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      {isCurrentUserAdmin && (
                        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleViewTeams(member)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Teams</span>
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Joining Soon Members */}
            {joiningSoonMembers.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800 dark:text-blue-300 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Joining Soon
                    <span className="ml-2 text-xs sm:text-sm font-normal text-blue-600 dark:text-blue-400">
                      ({joiningSoonMembers.length})
                    </span>
                  </h3>
                </div>

                {/* Desktop Table View */}
                <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joining Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User ID</th>
                      {isCurrentUserAdmin && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {joiningSoonMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {member.auth_fullname.dp ? (
                              <img
                                src={member.auth_fullname.dp}
                                alt={member.auth_fullname.fullname}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                                <span className="text-sm font-bold text-white">
                                  {getInitials(member.auth_fullname.fullname)}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.auth_fullname.fullname}
                                {member.user_id === currentUser?.id && ' (Me)'}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Starts in {Math.ceil((new Date(member.joining_date || member.created_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                            Pending Start
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(member.joining_date || member.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyMemberId(member.user_id)}
                            className="group flex items-center space-x-1 text-sm font-mono text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                            title={`Click to copy: ${member.user_id}`}
                          >
                            {copiedMemberId === member.user_id ? (
                              <span className="text-green-600">Copied!</span>
                            ) : (
                              <>
                                <span>{member.user_id.slice(0, 8)}...</span>
                              </>
                            )}
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </button>
                        </td>
                        {isCurrentUserAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewTeams(member)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all duration-200"
                                title="View teams"
                              >
                                <Users className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all duration-200"
                                title="Edit member"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                                title="Remove member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {joiningSoonMembers.map((member) => (
                    <div key={member.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      {/* Member Info */}
                      <div className="flex items-start space-x-3 mb-3">
                        {member.auth_fullname.dp ? (
                          <img
                            src={member.auth_fullname.dp}
                            alt={member.auth_fullname.fullname}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100 dark:border-gray-600 flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {getInitials(member.auth_fullname.fullname)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.auth_fullname.fullname}
                            {member.user_id === currentUser?.id && ' (Me)'}
                          </h4>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></div>
                              Pending Start
                            </span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Starts in {Math.ceil((new Date(member.joining_date || member.created_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </div>
                        </div>
                      </div>

                      {/* Member Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Joining Date</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {formatDate(member.joining_date || member.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">User ID</span>
                          <button
                            onClick={() => handleCopyMemberId(member.user_id)}
                            className="flex items-center space-x-1 font-mono text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {copiedMemberId === member.user_id ? (
                              <span className="text-green-600">Copied!</span>
                            ) : (
                              <>
                                <span>{member.user_id.slice(0, 8)}...</span>
                                <Copy className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      {isCurrentUserAdmin && (
                        <div className="flex items-center space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleViewTeams(member)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Teams</span>
                          </button>
                          <button
                            onClick={() => handleEditMember(member)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}
            </>
          )}
        </div>
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <EditMemberModal
        isOpen={showEditMemberModal}
        onClose={() => {
          setShowEditMemberModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />

      <MemberTeamsModal
        isOpen={showTeamsModal}
        onClose={() => {
          setShowTeamsModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
        onConfirm={confirmDeleteMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${selectedMember?.auth_fullname?.fullname || 'this member'} from the workspace? This action cannot be undone.`}
        confirmText="Remove Member"
        confirmVariant="danger"
      />
    </div>
    </>
  );
};

export default Members;