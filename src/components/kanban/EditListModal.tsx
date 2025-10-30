import React, { useState, useEffect } from 'react';
import { X, List, Palette, Loader2, AlertCircle, Sparkles, CheckCircle, Phone, Clock } from 'lucide-react';
import { KanbanList } from '../../types/kanban';
import { useKanban } from '../../hooks/useKanban';

interface EditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: KanbanList | null;
}

const EditListModal: React.FC<EditListModalProps> = ({ isOpen, onClose, list }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    confetti: false,
    is_final: false,
    activate_calls: false,
    call_absent_members: false,
    call_leave_members: false,
    call_time: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { updateList } = useKanban();

  const listColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  // Initialize form data when list changes
  useEffect(() => {
    if (list && isOpen) {
      setFormData({
        name: list.name || '',
        color: list.color || '#3B82F6',
        confetti: list.confetti || false,
        is_final: list.is_final || false,
        activate_calls: false,
        call_absent_members: false,
        call_leave_members: false,
        call_time: ''
      });
      setErrors({});
    }
  }, [list, isOpen]);

  if (!isOpen || !list) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'List name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    const result = await updateList(list.id, {
      name: formData.name.trim(),
      color: formData.color,
      confetti: formData.confetti,
      is_final: formData.is_final
    });
    
    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setErrors({ name: result.message || 'Failed to update list' });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: formData.color }}
            >
              <List className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit List</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Change list name and color</p>
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pinned-boards-scroll">
          {/* List Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              List Name *
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
              placeholder="Enter list name..."
            />
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </div>
            )}

            {/* Created By Info */}
            {list?.auth_fullname && (
              <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="mr-2">Created by:</span>
                <div className="flex items-center space-x-2">
                  {list.auth_fullname.dp ? (
                    <img
                      src={list.auth_fullname.dp}
                      alt={list.auth_fullname.fullname}
                      className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-medium text-white">
                        {list.auth_fullname.fullname.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{list.auth_fullname.fullname}</span>
                </div>
              </div>
            )}
          </div>

          {/* List Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Palette className="h-4 w-4 inline mr-1" />
              List Color
            </label>
            <div className="flex flex-wrap gap-3">
              {listColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 ${
                    formData.color === color ? 'border-gray-400 dark:border-gray-500 scale-110' : 'border-gray-200 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Confetti Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Sparkles className="h-4 w-4 inline mr-1" />
              Celebration Effects
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Confetti Animation</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Show confetti when cards are moved to this list</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confetti}
                  onChange={(e) => setFormData(prev => ({ ...prev, confetti: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Final List Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              List Type
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Final List</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mark cards as complete when moved to this list</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_final}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_final: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          {/* Activate Calls Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Phone className="h-4 w-4 inline mr-1" />
              Call Management
            </label>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Activate Calls</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable automated call management for this list</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.activate_calls}
                  onChange={(e) => setFormData(prev => ({ ...prev, activate_calls: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Call Settings - Only shown when activate_calls is true */}
          {formData.activate_calls && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-400">
              {/* Call Absent Members */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Call Absent Members</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Call members who haven't marked attendance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.call_absent_members}
                    onChange={(e) => setFormData(prev => ({ ...prev, call_absent_members: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Call Leave Members */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Call Leave-Taking Members</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Call members who are on leave</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.call_leave_members}
                    onChange={(e) => setFormData(prev => ({ ...prev, call_leave_members: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Time to Call */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Time to Call
                </label>
                <input
                  type="time"
                  value={formData.call_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, call_time: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set the time when calls should be made</p>
              </div>
            </div>
          )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListModal;