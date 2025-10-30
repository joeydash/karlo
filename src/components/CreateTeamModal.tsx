import React, { useState, useEffect } from 'react';
import { X, Users, Loader2, AlertCircle, Plus } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useToast } from '../contexts/ToastContext';
import AddTeamMemberModal from './AddTeamMemberModal';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const { createTeam } = useTeam();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setErrors({});
      setCreatedTeamId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Team name must not exceed 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())) {
      newErrors.name = 'Team name can only contain letters, numbers, spaces, and basic punctuation';
    }

    if (description.trim().length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsCreating(true);

    const result = await createTeam(name.trim(), description.trim() || undefined);

    setIsCreating(false);

    if (result.success && result.team) {
      showSuccess('Team created', `${name} has been created successfully`);
      setCreatedTeamId(result.team.id);
      setShowAddMemberModal(true);
    } else {
      showError('Creation failed', result.message || 'Failed to create team');
    }
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (!isCreating) {
        onClose();
      }
    }
  };

  const handleAddMembersClose = () => {
    setShowAddMemberModal(false);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"
        onClick={handleOutsideClick}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Create New Team</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Add a team to your workspace</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isCreating}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            <div>
              <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Name *
              </label>
              <input
                id="team-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                disabled={isCreating}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.name
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50`}
                placeholder="Enter team name..."
                autoFocus
              />
              {errors.name && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="team-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="team-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                disabled={isCreating}
                rows={4}
                maxLength={500}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none disabled:opacity-50 ${
                  errors.description
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="Enter team description..."
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.description && (
                  <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </div>
                )}
                <span className={`text-xs ml-auto ${
                  description.length > 450 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {description.length}/500
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Add Members</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    After creating the team, you'll be able to add members to it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-2xl sm:rounded-b-3xl">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isCreating}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create Team</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {createdTeamId && (
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={handleAddMembersClose}
          teamId={createdTeamId}
          teamName={name}
          currentMembers={[]}
        />
      )}
    </>
  );
};

export default CreateTeamModal;
