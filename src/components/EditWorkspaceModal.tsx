import React, { useState, useEffect } from 'react';
import { X, Building2, Loader2, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import { Organization } from '../types/organization';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { validateImageFile, hostMediaGoService } from '../utils/imageUpload';
import { AUTH_CONFIG } from '../utils/config';
import ConfirmationModal from './ConfirmationModal';

interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Organization | null;
}

const EditWorkspaceModal: React.FC<EditWorkspaceModalProps> = ({ isOpen, onClose, workspace }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    website: '',
    logo_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { updateOrganization, deleteOrganization, isLoading } = useOrganization();
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // Initialize form data when workspace changes
  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        display_name: workspace.display_name,
        description: workspace.description || '',
        website: workspace.website || '',
        logo_url: workspace.logo_url || ''
      });
    }
  }, [workspace]);

  if (!isOpen || !workspace) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Workspace name is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace slug is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = 'Slug can only contain lowercase letters, numbers, and underscores';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must be a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      showError('Image size must be less than 10MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const authStore = await import('../stores/authStore');
      const token = authStore.default.getState().token;

      if (!token || !user?.id) {
        showError('Authentication token not found');
        setIsUploadingLogo(false);
        return;
      }

      const result = await hostMediaGoService(
        file,
        'organisation_logo',
        user.id,
        token
      );

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, logo_url: result.url }));
        showSuccess('Logo uploaded successfully');
      } else {
        showError(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showError('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!workspace?.id) {
      setErrors({ display_name: 'Workspace not found' });
      return;
    }

    const result = await updateOrganization(workspace.id, {
      name: formData.name,
      display_name: formData.display_name,
      description: formData.description || undefined,
      website: formData.website || undefined,
      logo_url: formData.logo_url || undefined
    });

    if (result.success) {
      showSuccess('Workspace updated successfully');
      setErrors({});
      handleClose();
    } else {
      setErrors({ display_name: result.message || 'Failed to update workspace' });
      showError(result.message || 'Failed to update workspace');
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleDeleteOrganization = async () => {
    if (!workspace?.id) return;

    const result = await deleteOrganization(workspace.id);
    if (result.success) {
      showSuccess('Workspace deleted successfully');
      setShowDeleteConfirmation(false);
      onClose();
      navigate('/dashboard');
    } else {
      showError(result.message || 'Failed to delete workspace');
      setErrors({ display_name: result.message || 'Failed to delete workspace' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center py-4 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Workspace</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Update workspace settings</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Workspace Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspace Name *
            </label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, display_name: e.target.value }));
                if (errors.display_name) setErrors(prev => ({ ...prev, display_name: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.display_name ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="My Awesome Workspace"
            />
            {errors.display_name && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.display_name}
              </div>
            )}
          </div>

          {/* Workspace Slug */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspace Slug *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.name ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="my-awesome-workspace"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used in URLs. Only lowercase letters, numbers, and underscores.</p>
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of your workspace..."
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, website: e.target.value }));
                if (errors.website) setErrors(prev => ({ ...prev, website: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.website ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="https://example.com"
            />
            {errors.website && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.website}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workspace Logo
            </label>
            <div className="flex items-center space-x-4">
              {formData.logo_url && (
                <div className="w-20 h-20 rounded-xl border-2 border-gray-200 dark:border-gray-600 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                  <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="flex-1 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl transition-colors">
                  {isUploadingLogo ? (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : formData.logo_url ? (
                    <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                      <ImageIcon className="h-5 w-5" />
                      <span>Change Logo</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Upload className="h-5 w-5" />
                      <span>Upload Logo</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  disabled={isUploadingLogo}
                />
              </label>
            </div>
            {errors.logo && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.logo}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recommended: Square image, maximum 10MB. Supported formats: JPEG, PNG, GIF, WebP.</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Workspace'
              )}
            </button>
          </div>
        </form>

        {/* Delete Organization Section */}
        <div className="px-6 pb-6">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                Once you delete this workspace, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
              >
                <span>Delete Workspace</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteOrganization}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspace?.display_name}"? This action cannot be undone and will permanently delete all boards, cards, and data associated with this workspace.`}
        confirmText="Delete Workspace"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
  );
};

export default EditWorkspaceModal;