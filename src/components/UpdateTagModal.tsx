import React, { useState, useEffect } from "react";
import { X, Tag as TagIcon, Loader2, AlertCircle } from "lucide-react";
import { useTag } from "../hooks/useTag";
import { useToast } from "../contexts/ToastContext";
import { Tag } from "../types/tag";

interface UpdateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
}

const UpdateTagModal: React.FC<UpdateTagModalProps> = ({
  isOpen,
  onClose,
  tag,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateTag, isLoading } = useTag();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen && tag) {
      setFormData({
        name: tag.name,
        description: tag.description || "",
      });
      setErrors({});
    }
  }, [isOpen, tag]);

  if (!isOpen || !tag) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tag name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await updateTag(tag.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });

    if (result.success) {
      showSuccess("Tag updated successfully");
      setFormData({ name: "", description: "" });
      setErrors({});
      onClose();
    } else {
      showError(result.message || "Failed to update tag");
      setErrors({ name: result.message || "Failed to update tag" });
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Update Tag
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Edit tag details
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tag Name */}
          <div>
            <label
              htmlFor="update-tag-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tag Name *
            </label>
            <input
              id="update-tag-name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.name
                  ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400"
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="Enter tag name"
            />
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="update-tag-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="update-tag-description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of the tag..."
            />
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
                "Update Tag"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTagModal;
