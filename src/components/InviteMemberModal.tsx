import React, { useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, Smartphone, Calendar, User, Shield, IndianRupee, GraduationCap, UserCheck } from 'lucide-react';
import { useMember } from '../hooks/useMember';
import { useOrganization } from '../hooks/useOrganization';
import SelectMentorModal from './SelectMentorModal';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    phone: '',
    joining_date: new Date().toISOString().slice(0, 16), // Default to current date/time
    role: 'member', // Default role
    designation: '',
    compensation: '',
    is_intern: false,
    mentor_id: undefined as string | undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMentorModal, setShowMentorModal] = useState(false);
  const { inviteMember, isLoading, members } = useMember();
  const { currentOrganization } = useOrganization();

  const roleOptions = [
    { value: 'member', label: 'Member', icon: User, description: 'Standard workspace access' },
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Full workspace management access' }
  ];

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number with country code (e.g., +919876543210)';
    }

    if (!formData.joining_date) {
      newErrors.joining_date = 'Joining date is required';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!currentOrganization?.id) {
      setErrors({ phone: 'No organization selected' });
      return;
    }

    const result = await inviteMember({
      phone: formData.phone,
      organisation_id: currentOrganization.id,
      created_at: new Date(formData.joining_date).toISOString(),
      role: formData.role,
      designation: formData.designation,
      compensation: formData.compensation,
      is_intern: formData.is_intern,
      mentor_id: formData.mentor_id
    });

    if (result.success) {
      setFormData({
        phone: '',
        joining_date: new Date().toISOString().slice(0, 16),
        role: 'member',
        designation: '',
        compensation: '',
        is_intern: false,
        mentor_id: undefined
      });
      setErrors({});
      onClose();
    } else {
      setErrors({ phone: result.message || 'Failed to invite member' });
    }
  };

  const handleClose = () => {
    setFormData({
      phone: '',
      joining_date: new Date().toISOString().slice(0, 16),
      role: 'member',
      designation: '',
      compensation: '',
      is_intern: false,
      mentor_id: undefined
    });
    setErrors({});
    onClose();
  };

  const selectedMentor = members.find(m => m.id === formData.mentor_id);

  const selectedRoleOption = roleOptions.find(option => option.value === formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Invite Member</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Add a new member to your workspace</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Smartphone className="h-4 w-4 inline mr-1" />
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, phone: e.target.value }));
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.phone ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="+1234567890 or +919876543210"
            />
            {errors.phone && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.phone}
              </div>
            )}
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

          {/* Intern Toggle */}
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
            <label htmlFor="joining_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Joining Date *
            </label>
            <input
              id="joining_date"
              type="datetime-local"
              value={formData.joining_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, joining_date: e.target.value }));
                if (errors.joining_date) setErrors(prev => ({ ...prev, joining_date: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.joining_date ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {errors.joining_date && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.joining_date}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <SelectMentorModal
        isOpen={showMentorModal}
        onClose={() => setShowMentorModal(false)}
        onSelect={(mentorId) => setFormData(prev => ({ ...prev, mentor_id: mentorId }))}
        members={members}
        selectedMentorId={formData.mentor_id}
      />
    </div>
  );
};

export default InviteMemberModal;