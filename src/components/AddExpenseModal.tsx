import React, { useState, useEffect } from "react";
import {
  X,
  IndianRupee,
  Loader2,
  AlertCircle,
  Info,
  File,
  Trash2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useExpense } from "../hooks/useExpense";
import { useAuth } from "../hooks/useAuth";
import { useMember } from "../hooks/useMember";
import { useToast } from "../contexts/ToastContext";
import { hostMediaGoService, validateImageFile } from "../utils/imageUpload";
import useAuthStore from "../stores/authStore";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedMemberId?: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedMemberId,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    details: "",
    amount: "",
  });
  const [attachments, setAttachments] = useState<
    Array<{ file: File; url?: string; uploading: boolean }>
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { createExpense, isLoading } = useExpense();
  const { user: currentUser } = useAuth();
  const { members } = useMember();
  const { showSuccess, showError } = useToast();
  const { token } = useAuthStore();

  const targetUserId = selectedMemberId || currentUser?.id || "";
  const targetMember = members.find((m) => m.user_id === targetUserId);
  const isCreatingForOther =
    selectedMemberId && selectedMemberId !== currentUser?.id;

  // Cleanup object URLs when component unmounts or attachments change
  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.file.type.startsWith("image/") && !attachment.url) {
          const objectUrl = URL.createObjectURL(attachment.file);
          URL.revokeObjectURL(objectUrl);
        }
      });
    };
  }, [attachments]);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Add files with uploading state
    const newAttachments = validFiles.map((file) => ({
      file,
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);

    // Upload each file immediately
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const result = await hostMediaGoService(file, "expenses", token || "");

        if (result.success && result.url) {
          // Update the specific attachment with the URL
          setAttachments((prev) =>
            prev.map((att) =>
              att.file === file
                ? { ...att, url: result.url, uploading: false }
                : att
            )
          );
        } else {
          showError(`Failed to upload ${file.name}: ${result.error}`);
          // Remove failed upload
          setAttachments((prev) => prev.filter((att) => att.file !== file));
        }
      } catch {
        showError(`Failed to upload ${file.name}`);
        // Remove failed upload
        setAttachments((prev) => prev.filter((att) => att.file !== file));
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (): Promise<string[]> => {
    // Return already uploaded URLs
    return attachments
      .filter((att) => att.url && !att.uploading)
      .map((att) => att.url!);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!targetUserId || !targetMember?.id) {
      showError("Unable to create expense. Please try again.");
      return;
    }

    // Check if any attachments are still uploading
    const stillUploading = attachments.some((att) => att.uploading);
    if (stillUploading) {
      showError("Please wait for all attachments to finish uploading");
      return;
    }

    // Get already uploaded attachment URLs
    const attachmentUrls = await uploadAttachments();

    const result = await createExpense({
      user_id: targetUserId,
      member_id: targetMember.id,
      name: formData.name,
      details: formData.details,
      amount: parseFloat(formData.amount),
      attachments: attachmentUrls,
    });

    if (result.success) {
      showSuccess("Expense added successfully");
      handleClose();
      onSuccess();
    } else {
      showError(result.message || "Failed to add expense");
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      details: "",
      amount: "",
    });
    setAttachments([]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

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
                Add Expense
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Create a new expense record
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            title="Close"
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
            {/* Info Message - Creating expense for */}
            {isCreatingForOther && targetMember && (
              <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Creating expense for {targetMember.auth_fullname.fullname}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This expense will be recorded under their account
                  </p>
                </div>
              </div>
            )}

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

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachments
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileSelect}
                  title="Upload attachments"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {attachments.map((attachment, index) => {
                      const isPdf =
                        attachment.file.type === "application/pdf" ||
                        attachment.file.name.toLowerCase().endsWith(".pdf");
                      const isImage = attachment.file.type.startsWith("image/");
                      const previewUrl =
                        attachment.url ||
                        (isImage ? URL.createObjectURL(attachment.file) : null);

                      return (
                        <div
                          key={index}
                          className="relative group bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
                        >
                          {/* Preview Area */}
                          <div className="relative w-full h-24 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            {attachment.uploading ? (
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                                <span className="text-[10px] text-blue-500 font-medium">
                                  Uploading...
                                </span>
                              </div>
                            ) : isImage && previewUrl ? (
                              <img
                                src={previewUrl}
                                alt={attachment.file.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : isPdf ? (
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <FileText className="h-8 w-8 text-red-500" />
                                <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                                  PDF
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <File className="h-8 w-8 text-gray-400" />
                                <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                                  File
                                </span>
                              </div>
                            )}

                            {/* Delete Button Overlay */}
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              disabled={attachment.uploading}
                              className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove attachment"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* File Info */}
                          <div className="p-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-1.5">
                              {isImage ? (
                                <ImageIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              ) : isPdf ? (
                                <FileText className="h-3 w-3 text-red-500 flex-shrink-0" />
                              ) : (
                                <File className="h-3 w-3 text-gray-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-900 dark:text-white truncate font-medium">
                                  {attachment.file.name}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {(attachment.file.size / 1024 / 1024).toFixed(
                                    2
                                  )}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
              title="Cancel"
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || attachments.some((att) => att.uploading)}
              title="Add expense"
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : attachments.some((att) => att.uploading) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
