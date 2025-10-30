import React, { useState } from 'react';
import { User, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ProfileCompletionModalProps {
  isOpen: boolean;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen }) => {
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !user) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    } else if (formData.fullname.trim().length < 2) {
      newErrors.fullname = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await updateProfile({
      fullname: formData.fullname.trim(),
      email: formData.email.trim()
    });

    if (!result.success) {
      setErrors({ fullname: result.message || 'Failed to update profile' });
    }
    // Modal will close automatically when user data is updated and fields are no longer null
  };

  const isProfileIncomplete = !user.fullname || !user.email;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Please provide your details to continue</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">Profile completion required</p>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              To access all features, please complete your profile with your full name and email address.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Full Name *
            </label>
            <input
              id="fullname"
              type="text"
              value={formData.fullname}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, fullname: e.target.value }));
                if (errors.fullname) setErrors(prev => ({ ...prev, fullname: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.fullname ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Enter your full name"
              autoFocus
            />
            {errors.fullname && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.fullname}
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.email ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isUpdatingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating Profile...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;