import React, { useState } from 'react';
import { ArrowLeft, Calendar, Plus, Edit, Trash2, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHoliday } from '../hooks/useHoliday';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../contexts/ToastContext';
import CreateHolidayModal from '../components/CreateHolidayModal';
import EditHolidayModal from '../components/EditHolidayModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SideNavigation from '../components/SideNavigation';
import { Holiday } from '../types/holiday';

const Holidays: React.FC = () => {
  const navigate = useNavigate();
  const { holidays, isLoading, error, deleteHoliday } = useHoliday();
  const { currentOrganization } = useOrganization();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<{ id: string; reason: string } | null>(null);
  const { showSuccess, showError } = useToast();

  // Check if current user is admin in the current organization
  const isCurrentUserAdmin = currentOrganization?.user_role === 'admin';

  const handleDeleteHoliday = (holidayId: string, reason: string) => {
    setHolidayToDelete({ id: holidayId, reason });
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteHoliday = async () => {
    if (!holidayToDelete) return;

    const result = await deleteHoliday(holidayToDelete.id);
    if (result.success) {
      showSuccess('Holiday deleted successfully');
    } else {
      showError(result.message || 'Failed to delete holiday');
    }
    setShowDeleteConfirmation(false);
    setHolidayToDelete(null);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setShowEditModal(true);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'national':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'company':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'religious':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'regional':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'optional':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optional':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const mandatoryHolidays = holidays.filter(holiday => holiday.type !== 'optional');
  const optionalHolidays = holidays.filter(holiday => holiday.type === 'optional');

  const HolidayTable: React.FC<{ holidays: Holiday[]; title: string; emptyMessage: string; showActions?: boolean }> = ({
    holidays, 
    title, 
    emptyMessage,
    showActions = true
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          {title === 'Mandatory Holidays' ? (
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-green-600 flex-shrink-0" />
          ) : (
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-yellow-600 flex-shrink-0" />
          )}
          <span className="truncate">{title}</span>
          <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400 flex-shrink-0">
            ({holidays.length})
          </span>
        </h3>
      </div>

      {holidays.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{emptyMessage}</h3>
        </div>
      ) : (
        <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Holiday
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                {showActions && isCurrentUserAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {holidays.map((holiday) => (
                <tr key={holiday.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(holiday.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {holiday.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                      {getTypeIcon(holiday.type)}
                      <span className="capitalize">{holiday.type}</span>
                    </span>
                  </td>
                  {showActions && isCurrentUserAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteHoliday(holiday.id, holiday.reason)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                          title="Delete holiday"
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-100 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {holiday.reason}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {showActions && isCurrentUserAdmin && (
                  <button
                    onClick={() => handleDeleteHoliday(holiday.id, holiday.reason)}
                    className="ml-2 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 flex-shrink-0"
                    title="Delete holiday"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                {getTypeIcon(holiday.type)}
                <span className="capitalize">{holiday.type}</span>
              </span>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );

  const ShimmerTable = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
              <div className="h-8 w-8 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <button
                onClick={() => navigate('/leaves')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Holidays</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isCurrentUserAdmin && (
          <div>
            {isCurrentUserAdmin && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Add Holiday</span>
              </button>
            )}
          </div>
        )}
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
          <div className="flex items-center justify-between py-3 sm:py-4 gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => navigate('/leaves')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Holidays</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>

            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg flex-shrink-0"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add Holiday</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {isLoading ? (
          <div className="space-y-8">
            <ShimmerTable />
            <ShimmerTable />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Mandatory Holidays */}
            <HolidayTable 
              holidays={mandatoryHolidays}
              title="Mandatory Holidays"
              emptyMessage="No mandatory holidays found"
              showActions={isCurrentUserAdmin}
            />

            {/* Optional Holidays */}
            <HolidayTable 
              holidays={optionalHolidays}
              title="Optional Holidays"
              emptyMessage="No optional holidays found"
              showActions={isCurrentUserAdmin}
            />
          </div>
        )}
      </div>
      
      <CreateHolidayModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      <EditHolidayModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedHoliday(null);
        }}
        holiday={selectedHoliday}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setHolidayToDelete(null);
        }}
        onConfirm={confirmDeleteHoliday}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${holidayToDelete?.reason}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
    </>
  );
};

export default Holidays;