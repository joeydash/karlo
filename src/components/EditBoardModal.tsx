import React, { useState, useEffect } from 'react';
import { X, Layout, Loader2, AlertCircle, Palette, EyeOff, Users } from 'lucide-react';
import { useBoard } from '../hooks/useBoard';
import { useToast } from '../contexts/ToastContext';
import { Board } from '../types/board';

interface EditBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
}

const EditBoardModal: React.FC<EditBoardModalProps> = ({ isOpen, onClose, board }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'organization' as 'private' | 'organization' | 'public',
    background_color: '#3B82F6',
    background_image_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateBoard, isLoading } = useBoard();
  const { showSuccess, showError } = useToast();

  const backgroundColors = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#A855F7', // Violet
  '#3E6066', // Deep Teal
  '#6B8C89', // Soft Teal
  '#7C8577', // Dusty Olive
  '#A3B18A', // Sage Green
  '#B6A998', // Warm Taupe
  '#D1C0A8', // Clay Beige
  '#C98F70', // Muted Terracotta
  '#E6D9C6', // Soft Sand
  '#1E293B', // Slate
  '#374151', // Gray
  '#DC2626', // Dark Red
  '#7C3AED'  // Deep Purple
];

  // Initialize form data when board changes
  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name,
        description: board.description || '',
        visibility: board.visibility,
        background_color: board.background_color || '#3B82F6',
        background_image_url: board.background_image_url || ''
      });
    } else if (isOpen) {
      // Set random background color when creating new board (if no board data)
      const randomColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
      setFormData(prev => ({ ...prev, background_color: randomColor }));
    }
  }, [board, isOpen]);

  if (!isOpen || !board) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Board name is required';
    }

    if (formData.background_image_url && !formData.background_image_url.match(/^https?:\/\/.+/)) {
      newErrors.background_image_url = 'Background image must be a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check if background color changed
    const backgroundColorChanged = board && formData.background_color !== board.background_color;
    const result = await updateBoard(board.id, {
      name: formData.name,
      description: formData.description || undefined,
      visibility: formData.visibility,
      background_color: formData.background_color,
      background_image_url: formData.background_image_url || undefined
    });

    if (result.success) {
      showSuccess('Board updated successfully');
      setErrors({});
      onClose();

      // Refresh page if background color changed
      if (backgroundColorChanged) {
        window.location.reload();
      }
    } else {
      showError(result.message || 'Failed to update board');
      setErrors({ name: result.message || 'Failed to update board' });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const visibilityOptions = [
    { value: 'private', label: 'Private', icon: EyeOff, description: 'Only you can see this board' },
    { value: 'organization', label: 'Organization', icon: Users, description: 'All organization members can see this board' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Board</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Update your board settings</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Board Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Board Name *
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
              placeholder="My Awesome Board"
            />
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </div>
            )}

            {/* Created By Info */}
            {board?.auth_fullname && (
              <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="mr-2">Created by:</span>
                <div className="flex items-center space-x-2">
                  {board.auth_fullname.dp ? (
                    <img
                      src={board.auth_fullname.dp}
                      alt={board.auth_fullname.fullname}
                      className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-medium text-white">
                        {board.auth_fullname.fullname.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{board.auth_fullname.fullname}</span>
                </div>
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
              placeholder="Brief description of your board..."
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Visibility
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, visibility: option.value as 'private' | 'organization' | 'public' }))}
                    className={`w-full flex items-start p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.visibility === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                      formData.visibility === option.value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className="text-left flex-1">
                      <div className={`font-medium ${
                        formData.visibility === option.value
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {option.description}
                      </div>
                    </div>
                    {formData.visibility === option.value && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Palette className="h-4 w-4 inline mr-1" />
              Background Color
            </label>
            <div className="flex flex-wrap gap-3">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, background_color: color }))}
                  className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 ${
                    formData.background_color === color ? 'border-gray-400 dark:border-gray-500 scale-110' : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Background Image URL */}
          <div>
            <label htmlFor="background_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Background Image URL (Optional)
            </label>
            <input
              id="background_image_url"
              type="url"
              value={formData.background_image_url}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, background_image_url: e.target.value }));
                if (errors.background_image_url) setErrors(prev => ({ ...prev, background_image_url: '' }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.background_image_url ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.background_image_url && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.background_image_url}
              </div>
            )}
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
                'Update Board'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBoardModal;