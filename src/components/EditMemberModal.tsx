import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, AlertCircle, User, Shield, Users as UsersIcon, IndianRupee, GraduationCap, UserCheck } from 'lucide-react';
import { useMember } from '../hooks/useMember';
import SelectMentorModal from './SelectMentorModal';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, member }) => {
  const [formData, setFormData] = useState({
    joiningDate: '',
    role: 'member',
    designation: '',
    compensation: '',
    is_intern: false,
    mentor_id: undefined as string | undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMentorModal, setShowMentorModal] = useState(false);
  const { updateMemberJoiningDate, updateMemberRole, updateMemberDesignation, updateMemberCompensation, updateMemberInternStatus, updateMemberMentor, isLoading, members } = useMember();

  const roleOptions = [
    { value: 'member', label: 'Member', icon: User, description: 'Standard workspace access' },
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Full workspace management access' }
  ];

  // Initialize form data when member changes
  useEffect(() => {
    if (member && isOpen) {
      // Convert the joining_date or created_at date to datetime-local format
      const date = new Date(member.joining_date || member.created_at);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setFormData({
        joiningDate: localDateTime,
        role: member.role || 'member',
        designation: member.designation || '',
        compensation: member.compensation || '',
        is_intern: member.is_intern || false,
        mentor_id: member.mentor_id
      });
      setErrors({});
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.joiningDate) {
      newErrors.joiningDate = 'Joining date is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check what needs to be updated
    const originalJoiningDate = new Date(member.joining_date || member.created_at).toISOString().slice(0, 16);
    const originalRole = member.role || 'member';
    const originalDesignation = member.designation || '';
    const originalCompensation = member.compensation || '';
    const originalInternStatus = member.is_intern || false;
    const originalMentorId = member.mentor_id;

    const needsJoiningDateUpdate = formData.joiningDate !== originalJoiningDate;
    const needsRoleUpdate = formData.role !== originalRole;
    const needsDesignationUpdate = formData.designation !== originalDesignation;
    const needsCompensationUpdate = formData.compensation !== originalCompensation;
    const needsInternStatusUpdate = formData.is_intern !== originalInternStatus;
    const needsMentorUpdate = formData.mentor_id !== originalMentorId;

    let success = true;
    let errorMessage = '';

    // Update joining date if changed
    if (needsJoiningDateUpdate) {
      const result = await updateMemberJoiningDate(member.id, new Date(formData.joiningDate).toISOString());
      if (!result.success) {
        success = false;
        errorMessage = result.message || 'Failed to update joining date';
      }
    }

    // Update role if changed
    if (needsRoleUpdate && success) {
      const result = await updateMemberRole(member.id, formData.role);
      if (!result.success) {
        success = false;
        errorMessage = result.message || 'Failed to update role';
      }
    }

    // Update designation if changed
    if (needsDesignationUpdate && success) {
      const result = await updateMemberDesignation(member.id, formData.designation);
      if (!result.success) {
        success = false;
        errorMessage = result.message || 'Failed to update designation';
      }
    }

    // Update compensation if changed
    if (needsCompensationUpdate && success) {
      const result = await updateMemberCompensation(member.id, formData.compensation);
      if (!result.success) {
        success = false;
        errorMessage = result.message || 'Failed to update compensation';
      }
    }

    // Update intern status if changed
    if (needsInternStatusUpdate && success) {
      const result = await updateMemberInternStatus(member.id, formData.is_intern);
      if (!result.success) {
        success = false;
        errorMessage = result.message || 'Failed to update intern status';
      }
    }

    // Update mentor if changed
    if (needsMentorUpdate && success) {
      const result = await updateMemberMentor(member.id, formData.mentor_id);
      if (!result.success) {
        success = false;
        errorMessage = result.message || 'Failed to update mentor';
      }
    }

    if (success) {
      setErrors({});
      onClose();
    } else {
      setErrors({ joiningDate: errorMessage });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const selectedMentor = members.find(m => m.id === formData.mentor_id);

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedRoleOption = roleOptions.find(option => option.value === formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Edit Member</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Update member details and permissions</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>


        <div className="flex flex-col max-h-[70vh]">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* Member Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            {member.auth_fullname.dp ? (
              <img
                src={member.auth_fullname.dp}
                alt={member.auth_fullname.fullname}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                <span className="text-sm font-bold text-white">
                  {getInitials(member.auth_fullname.fullname)}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.auth_fullname.fullname}</h3>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  (member.role || 'member') === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  {selectedRoleOption?.icon && <selectedRoleOption.icon className="h-3 w-3 mr-1" />}
                  {(member.role || 'member').charAt(0).toUpperCase() + (member.role || 'member').slice(1)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  • Joined {new Date(member.joining_date || member.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Shield className="h-4 w-4 inline mr-1" />
              Role *
            </label>
            <div className="space-y-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, role: option.value }));
                    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      option.value === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900/30' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <option.icon className={`h-4 w-4 ${
                        option.value === 'admin' 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                    </div>
                  </div>
                  {formData.role === option.value && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.role && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.role}
              </div>
            )}
          </div>

          {/* Designation */}
          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Designation
            </label>
            <input
              id="designation"
              type="text"
              value={formData.designation}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, designation: e.target.value }));
                if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.designation ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., Software Engineer, Manager"
            />
            {errors.designation && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.designation}
              </div>
            )}
          </div>

          {/* Compensation */}
          <div>
            <label htmlFor="compensation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <IndianRupee className="h-4 w-4 inline mr-1" />
              Compensation
            </label>
            <input
              id="compensation"
              type="text"
              value={formData.compensation}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, compensation: e.target.value }));
                if (errors.compensation) setErrors(prev => ({ ...prev, compensation: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.compensation ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., 50000, 75000"
            />
            {errors.compensation && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.compensation}
              </div>
            )}
          </div>

          {/* Intern Status Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <GraduationCap className="h-4 w-4 inline mr-1" />
              Employment Type
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Intern Position</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Probationary period with PPO consideration</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_intern}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_intern: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Mentor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserCheck className="h-4 w-4 inline mr-1" />
              Mentor (Optional)
            </label>
            <button
              type="button"
              onClick={() => setShowMentorModal(true)}
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 bg-white dark:bg-gray-700 text-left"
            >
              {selectedMentor ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMentor.auth_fullname.fullname}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedMentor.designation || selectedMentor.role}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, mentor_id: undefined }));
                    }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to select a mentor</p>
                </div>
              )}
            </button>
          </div>

          {/* Joining Date */}
          <div>
            <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Joining Date *
            </label>
            <input
              id="joiningDate"
              type="datetime-local"
              value={formData.joiningDate}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, joiningDate: e.target.value }));
                if (errors.joiningDate) setErrors(prev => ({ ...prev, joiningDate: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.joiningDate ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {errors.joiningDate && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.joiningDate}
              </div>
            )}
          </div>
          </form>

          {/* Fixed Actions at Bottom */}
          <div className="border-t border-gray-200 dark:border-gray-600 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-b-2xl sm:rounded-b-3xl">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Update Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SelectMentorModal
        isOpen={showMentorModal}
        onClose={() => setShowMentorModal(false)}
        onSelect={(mentorId) => setFormData(prev => ({ ...prev, mentor_id: mentorId }))}
        members={members}
        currentMemberId={member.id}
        selectedMentorId={formData.mentor_id}
      />
    </div>
  );
};

export default EditMemberModal;