import React, { useState } from 'react';
import { ArrowLeft, Settings, Plus, Edit, Trash2, Calendar, FileText, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeaveType } from '../hooks/useLeaveType';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../contexts/ToastContext';
import CreateLeaveTypeModal from '../components/CreateLeaveTypeModal';
import EditLeaveTypeModal from '../components/EditLeaveTypeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SideNavigation from '../components/SideNavigation';
import { LeaveType } from '../types/leaveType';

const LeaveSettings: React.FC = () => {
  const navigate = useNavigate();
  const { leaveTypes, isLoading, error, deleteLeaveType } = useLeaveType();
  const { currentOrganization } = useOrganization();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<{ id: string; name: string } | null>(null);
  const { showSuccess, showError } = useToast();

  // Check if current user is admin in the current organization
  const isCurrentUserAdmin = currentOrganization?.user_role === 'admin';

  const handleDeleteLeaveType = (leaveTypeId: string, displayName: string) => {
    setLeaveTypeToDelete({ id: leaveTypeId, name: displayName });
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteLeaveType = async () => {
    if (!leaveTypeToDelete) return;

    const result = await deleteLeaveType(leaveTypeToDelete.id);
    if (result.success) {
      showSuccess('Leave type deleted successfully');
    } else {
      showError(result.message || 'Failed to delete leave type');
    }
    setShowConfirmDeleteModal(false);
    setLeaveTypeToDelete(null);
  };

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setShowEditModal(true);
  };

  // Filter leave types based on search term
  const filteredLeaveTypes = leaveTypes.filter(leaveType =>
    leaveType.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leaveType.type_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
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
                onClick={() => navigate('/leaves')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Settings className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">Leave Settings</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load leave settings</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/leaves')}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Leaves</span>
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
                onClick={() => navigate('/leaves')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Leave Settings</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>

            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg flex-shrink-0"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add Leave Type</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {isLoading ? (
          <div className="space-y-6">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
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
          </div>
        ) : filteredLeaveTypes.length === 0 && !searchTerm ? (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No leave types configured</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Set up leave types to define your organization's leave policies</p>
            {isCurrentUserAdmin && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Add Your First Leave Type</span>
              </button>
            )}
          </div>
        ) : filteredLeaveTypes.length === 0 && searchTerm ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No leave types found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">No leave types match "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
            >
              <X className="h-4 w-4" />
              <span>Clear Search</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Leave Types</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {searchTerm ? (
                    <>
                      {filteredLeaveTypes.length} of {leaveTypes.length} leave type{leaveTypes.length !== 1 ? 's' : ''}
                      {filteredLeaveTypes.length > 0 && ` matching "${searchTerm}"`}
                    </>
                  ) : (
                    `${leaveTypes.length} leave type${leaveTypes.length !== 1 ? 's' : ''} configured`
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
                    placeholder="Search leave types..."
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

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                      Leave Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                      Code
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                      Allowance
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                      Description
                    </th>
                    {isCurrentUserAdmin && (
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLeaveTypes.map((leaveType) => (
                    <tr key={leaveType.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {leaveType.display_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {leaveType.type_code}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {leaveType.allowance_days}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            day{leaveType.allowance_days !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs sm:max-w-sm md:max-w-md truncate">
                          {leaveType.description || (
                            <span className="italic text-gray-400 dark:text-gray-500">No description</span>
                          )}
                        </div>
                      </td>
                      {isCurrentUserAdmin && (
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditLeaveType(leaveType)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all duration-200"
                              title="Edit leave type"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLeaveType(leaveType.id, leaveType.display_name)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                              title="Delete leave type"
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
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredLeaveTypes.map((leaveType) => (
                <div key={leaveType.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {leaveType.display_name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mt-1">
                          {leaveType.type_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Allowance</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {leaveType.allowance_days} day{leaveType.allowance_days !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Description</span>
                      <p className="text-gray-900 dark:text-white line-clamp-2">
                        {leaveType.description || (
                          <span className="italic text-gray-400 dark:text-gray-500">No description</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {isCurrentUserAdmin && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handleEditLeaveType(leaveType)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLeaveType(leaveType.id, leaveType.display_name)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateLeaveTypeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditLeaveTypeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLeaveType(null);
        }}
        leaveType={selectedLeaveType}
      />

      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => {
          setShowConfirmDeleteModal(false);
          setLeaveTypeToDelete(null);
        }}
        onConfirm={confirmDeleteLeaveType}
        title="Delete Leave Type"
        message={`Are you sure you want to delete "${leaveTypeToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isLoading}
      />
    </div>
    </>
  );
};

export default LeaveSettings;