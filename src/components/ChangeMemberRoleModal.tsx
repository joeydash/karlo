import React, { useState, useEffect } from 'react';
import { X, UserCog, Loader2, AlertCircle, Save } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useToast } from '../contexts/ToastContext';

interface ChangeMemberRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  currentRole: string;
}

const ChangeMemberRoleModal: React.FC<ChangeMemberRoleModalProps> = ({
  isOpen,
  onClose,
  memberId,
  memberName,
  currentRole,
}) => {
  const [role, setRole] = useState(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const { updateMemberRole } = useTeam();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      setRole(currentRole);
      setError('');
    }
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!role.trim()) {
      setError('Role is required');
      return;
    }

    if (role.trim() === currentRole) {
      setError('Please change the role before updating');
      return;
    }

    setIsUpdating(true);
    setError('');

    const result = await updateMemberRole(memberId, role.trim());

    setIsUpdating(false);

    if (result.success) {
      showSuccess('Role updated', `${memberName}'s role has been updated to ${role.trim()}`);
      onClose();
    } else {
      showError('Update failed', result.message || 'Failed to update role');
      setError(result.message || 'Failed to update role');
    }
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUpdating) {
      onClose();
    }
  };

  const commonRoles = ['Member', 'Lead', 'Manager', 'Developer', 'Designer', 'Tester'];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-[60]"
      onClick={handleOutsideClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Change Role</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Update member's role</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="text-base font-semibold text-blue-600 dark:text-blue-400">{memberName}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Current Role: <span className="font-semibold">{currentRole}</span>
            </p>
          </div>

          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Role *
            </label>
            <input
              id="member-role"
              type="text"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (error) setError('');
              }}
              disabled={isUpdating}
              list="role-suggestions"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                error
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50`}
              placeholder="Enter role..."
            />
            <datalist id="role-suggestions">
              {commonRoles.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            {error && (
              <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Common roles: {commonRoles.join(', ')}
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-2xl">
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update Role</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeMemberRoleModal;
