import React, { useState, useEffect } from "react";
import {
  X,
  IndianRupee,
  Loader2,
  AlertCircle,
  Upload,
  File,
  Trash2,
} from "lucide-react";
import { useExpense } from "../hooks/useExpense";
import { useToast } from "../contexts/ToastContext";
import { Expense } from "../types/expense";
import { hostMediaGoService, validateImageFile } from "../utils/imageUpload";
import useAuthStore from "../stores/authStore";

interface UpdateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense | null;
}

const UpdateExpenseModal: React.FC<UpdateExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expense,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    details: "",
    amount: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateExpense, isLoading } = useExpense();
  const { showSuccess, showError } = useToast();
  const { token } = useAuthStore();

  useEffect(() => {
    if (expense && isOpen) {
      setFormData({
        name: expense.name,
        details: expense.details || "",
        amount: expense.amount.toString(),
      });
      setExistingAttachments(expense.attachments || []);
      setAttachments([]);
    }
  }, [expense, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Expense name is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        showError(validation.error || "Invalid file");
      }
    }

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of attachments) {
      try {
        const result = await hostMediaGoService(
          file,
          "expenses",
          expense?.user_id || "",
          token || ""
        );

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          showError(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        showError(`Failed to upload ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expense || !validateForm()) {
      return;
    }

    // Upload new attachments first
    const newAttachmentUrls =
      attachments.length > 0 ? await uploadAttachments() : [];

    // Combine existing and new attachments
    const allAttachments = [...existingAttachments, ...newAttachmentUrls];

    const result = await updateExpense(expense.id, {
      name: formData.name,
      details: formData.details,
      amount: parseFloat(formData.amount),
      attachments: allAttachments,
    });

    if (result.success) {
      showSuccess("Expense updated successfully");
      handleClose();
      onSuccess();
    } else {
      showError(result.message || "Failed to update expense");
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      details: "",
      amount: "",
    });
    setAttachments([]);
    setExistingAttachments([]);
    setErrors({});
    onClose();
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Update Expense
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Edit expense details
              </p>
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 pinned-boards-scroll">
            {/* Expense Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Expense Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Travel, Meals, Supplies"
              />
              {errors.name && (
                <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Amount *
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (errors.amount) setErrors({ ...errors, amount: "" });
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <div className="flex items-center mt-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.amount}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <label
                htmlFor="details"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Details
              </label>
              <textarea
                id="details"
                value={formData.details}
                onChange={(e) =>
                  setFormData({ ...formData, details: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Additional details about the expense..."
              />
            </div>

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Existing Attachments
                </label>
                <div className="space-y-2">
                  {existingAttachments.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-gray-500" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Attachment {index + 1}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add New Attachments
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <File className="h-5 w-5 text-gray-500" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                  Updating...
                </>
              ) : (
                "Update Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateExpenseModal;
