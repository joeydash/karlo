import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  LogOut,
  Smartphone,
  Car as IdCard,
  CreditCard,
  Upload,
  Image as ImageIcon,
  Edit,
  Camera,
  Trash2,
  Clock,
  MapPin,
  Award,
  FileText,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { useOrganization } from "../hooks/useOrganization";
import { useMember } from "../hooks/useMember";
import { useAddress } from "../hooks/useAddress";
import BankDetailsForm from "./BankDetailsForm";
import { AUTH_CONFIG } from "../utils/config";
import { hostMediaGoService, validateImageFile } from "../utils/imageUpload";
import ImageCropModal from "./ImageCropModal";
import AddressListModal from "./AddressListModal";
import OfferLetterModal from "./OfferLetterModal";
import { Member } from "../types/member";

const DEFAULT_DP_URL =
  "https://cdn.subspace.money/whatsub_images/user-3711850-3105265+1.png";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, updateProfile, isUpdatingProfile, logout, isLoggingOut } =
    useAuth();
  const { showSuccess, showError } = useToast();
  const { currentOrganization } = useOrganization();
  const { members } = useMember();
  const {
    addresses,
    isLoading: isLoadingAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useAddress();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    dp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>("");
  const [showRemoveDpConfirm, setShowRemoveDpConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [selectedMemberForOffer, setSelectedMemberForOffer] =
    useState<Member | null>(null);
  const bankDetailsRef = React.useRef<{ loadBankDetails: () => Promise<void> }>(
    null
  );

  // Initialize form data when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        dp: (user as any).dp || "",
      });
      setErrors({});
      setIsEditMode(false);
    }
    // Reset flip state when modal opens
    setIsFlipped(false);
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = "Full name is required";
    } else if (formData.fullname.trim().length < 2) {
      newErrors.fullname = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email Id is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email Id";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (croppedImageBlob: Blob) => {
    if (!user?.id) return;

    setIsUploadingImage(true);

    try {
      // Convert blob to file
      const file = new File([croppedImageBlob], "profile.jpg", {
        type: "image/jpeg",
      });

      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        showError(validation.error || "Invalid image file");
        setIsUploadingImage(false);
        return;
      }

      // Get auth token from user store
      const authStore = await import("../stores/authStore");
      const token = authStore.default.getState().token;

      if (!token) {
        showError("Authentication token not found");
        setIsUploadingImage(false);
        return;
      }

      // Upload image to media service
      const uploadResult = await hostMediaGoService(
        file,
        "user_profile_pic",
        token
      );

      if (!uploadResult.success) {
        showError(uploadResult.error || "Failed to upload profile picture");
        setIsUploadingImage(false);
        setIsCropModalOpen(false);
        return;
      }

      const newDpUrl = uploadResult.url;
      if (newDpUrl) {
        // Update local state
        setFormData((prev) => ({ ...prev, dp: newDpUrl }));
        // Update profile to sync with backend
        await updateProfile({
          fullname: formData.fullname,
          email: formData.email,
          dp: newDpUrl,
        });
        showSuccess("Profile picture updated successfully");
        setIsCropModalOpen(false);
      } else {
        showError("Failed to update profile picture");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showError("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showError("Please select an image file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError("Image size must be less than 10MB");
        return;
      }

      // Create object URL for the image
      const imageUrl = URL.createObjectURL(file);
      setSelectedImageSrc(imageUrl);
      setIsCropModalOpen(true);
    }
    // Reset the input value
    event.target.value = "";
  };

  const handleCloseCropModal = () => {
    setIsCropModalOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
      setSelectedImageSrc("");
    }
  };

  const handleRemoveDP = async () => {
    if (!user?.id) return;

    setIsUploadingImage(true);
    setShowRemoveDpConfirm(false);

    try {
      // Update profile with default image URL
      const result = await updateProfile({
        fullname: formData.fullname,
        email: formData.email,
        dp: DEFAULT_DP_URL,
      });

      if (result.success) {
        setFormData((prev) => ({ ...prev, dp: DEFAULT_DP_URL }));
        showSuccess("Profile picture reset to default");
      } else {
        showError(result.message || "Failed to reset profile picture");
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      showError("Failed to reset profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await updateProfile({
      fullname: formData.fullname.trim(),
      email: formData.email.trim(),
    });

    if (result.success) {
      showSuccess("Profile updated successfully");
      setIsEditMode(false);
      setErrors({});
    } else {
      setErrors({ fullname: result.message || "Failed to update profile" });
      showError(result.message || "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    onClose();
  };

  const handleBankDetailsClick = () => {
    setIsFlipped(true);
    // Trigger bank details fetch when flipping to bank details view
    if (bankDetailsRef.current) {
      bankDetailsRef.current.loadBankDetails();
    }
  };

  const handleBackToProfile = () => {
    setIsFlipped(false);
    setIsEditMode(false);
    // Reset scroll position after animation completes
    setTimeout(() => {
      const scrollContainer = document.querySelector(".profile-modal-scroll");
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }, 750);
  };

  const handleCancelEdit = () => {
    // Reset form data to original user data
    setFormData({
      fullname: user.fullname || "",
      email: user.email || "",
      dp: (user as any).dp || "",
    });
    setErrors({});
    setIsEditMode(false);
  };

  const handleAddAddress = async (data: any) => {
    if (!user?.id) return;
    const result = await addAddress(user.id, data);
    if (result.success) {
      showSuccess("Address added successfully");
    } else {
      showError(result.message || "Failed to add address");
    }
  };

  const handleUpdateAddress = async (id: string, data: any) => {
    const result = await updateAddress(id, data);
    if (result.success) {
      showSuccess("Address updated successfully");
    } else {
      showError(result.message || "Failed to update address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const result = await deleteAddress(id);
    if (result.success) {
      showSuccess("Address deleted successfully");
    } else {
      showError(result.message || "Failed to delete address");
    }
  };

  const handleOfferLetterClick = () => {
    const currentUserMember = members.find(
      (member) => member.user_id === user?.id
    );
    if (currentUserMember) {
      setSelectedMemberForOffer(currentUserMember);
      setShowOfferLetterModal(true);
    } else {
      if (members.length > 0) {
        setSelectedMemberForOffer(members[0]);
        setShowOfferLetterModal(true);
      }
    }
  };

  // Check if there are any changes (excluding dp since it's handled separately)
  const hasChanges = user
    ? formData.fullname.trim() !== (user.fullname || "") ||
      formData.email.trim() !== (user.email || "")
    : false;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div className="relative max-w-2xl w-full h-[95vh] sm:h-[90vh] perspective-1000 overflow-hidden">
          <div
            className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* Front Side - Profile View/Edit */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden ${
                isFlipped ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                        {isEditMode ? "Edit Profile" : "My Profile"}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {isEditMode
                          ? "Update your information"
                          : "View your account details"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    {!isEditMode && (
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        disabled={isLoggingOut}
                        className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Logout"
                      >
                        {isLoggingOut ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            <span className="hidden sm:inline">
                              Logging out...
                            </span>
                          </>
                        ) : (
                          <>
                            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Logout</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors duration-200"
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 overflow-y-auto profile-modal-scroll"
                  style={{ overflowY: "auto", height: "auto" }}
                >
                  {!isEditMode ? (
                    /* View Mode - Profile Display */
                    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
                      {/* Profile Picture and Name Section */}
                      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                        <div className="relative group">
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            {formData.dp ? (
                              <img
                                src={formData.dp}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 group-hover:scale-110">
                            {isUploadingImage ? (
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileSelect}
                              disabled={isUploadingImage}
                            />
                          </label>
                          {formData.dp && formData.dp !== DEFAULT_DP_URL && (
                            <button
                              onClick={() => setShowRemoveDpConfirm(true)}
                              disabled={isUploadingImage}
                              className="absolute bottom-0 left-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove profile picture"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </button>
                          )}
                        </div>
                        <div className="px-4">
                          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            {formData.fullname || "No Name"}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">
                              {formData.email || "No Email"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Account Details */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                          <IdCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                          Account Information
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Phone Number
                                  </p>
                                  <p className="text-base sm:text-lg font-semibold font-mono text-gray-900 dark:text-white">
                                    {user.phone}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
                                Verified
                              </span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <IdCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  User ID
                                </p>
                                <p className="text-xs sm:text-sm font-mono text-gray-900 dark:text-white break-all">
                                  {user.id}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 sm:space-y-3">
                        {/* Edit Profile and Manage Addresses - Side by Side */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <button
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit Profile</span>
                          </button>

                          <button
                            onClick={() => setIsAddressModalOpen(true)}
                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl transition-all duration-200 shadow-lg"
                          >
                            <MapPin className="h-4 w-4" />
                            <span>Manage Addresses</span>
                          </button>
                        </div>

                        {/* Bank Details and My Expenses - Side by Side */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <button
                            onClick={handleBankDetailsClick}
                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-xl transition-all duration-200 shadow-lg"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Bank Details</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              navigate("/expenses");
                            }}
                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl transition-all duration-200 shadow-lg"
                          >
                            <IndianRupee className="h-4 w-4" />
                            <span>My Expenses</span>
                          </button>
                        </div>

                        {/* Offer Letter and Certificates - Side by Side */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <button
                            onClick={handleOfferLetterClick}
                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl transition-all duration-200 shadow-lg"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Offer Letter</span>
                          </button>

                          <button
                            onClick={() => {
                              onClose();
                              navigate("/certificates");
                            }}
                            className="flex items-center justify-center space-x-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all duration-200 shadow-lg"
                          >
                            <Award className="h-4 w-4" />
                            <span>Certificates</span>
                          </button>
                        </div>

                        {/* Logout Button - Full Width */}
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          disabled={isLoggingOut}
                          className="w-full flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          {isLoggingOut ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Logging out...</span>
                            </>
                          ) : (
                            <>
                              <LogOut className="h-4 w-4" />
                              <span>Secure Logout</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Edit Mode - Form */
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Profile Picture Upload */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                          Profile Picture
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                            {formData.dp ? (
                              <img
                                src={formData.dp}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                            )}
                          </div>
                          <div className="flex-1 w-full">
                            <label className="cursor-pointer">
                              <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-colors duration-200">
                                {isUploadingImage ? (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Uploading...</span>
                                  </div>
                                ) : formData.dp ? (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                    <ImageIcon className="h-5 w-5" />
                                    <span>Change Picture</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Upload className="h-5 w-5" />
                                    <span>Upload Picture</span>
                                  </div>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                                disabled={isUploadingImage}
                              />
                            </label>
                            {errors.dp && (
                              <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.dp}
                              </div>
                            )}
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
                              Maximum file size: 10MB. Images will be compressed
                              for optimal performance.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Edit Profile Form */}
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                          <label
                            htmlFor="fullname"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            <User className="h-4 w-4 inline mr-1" />
                            Full Name *
                          </label>
                          <input
                            id="fullname"
                            type="text"
                            value={formData.fullname}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                fullname: e.target.value,
                              }));
                              if (errors.fullname)
                                setErrors((prev) => ({
                                  ...prev,
                                  fullname: "",
                                }));
                            }}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                              errors.fullname
                                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400"
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            placeholder="Enter your full name"
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
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            <Mail className="h-4 w-4 inline mr-1" />
                            Email Id *
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }));
                              if (errors.email)
                                setErrors((prev) => ({ ...prev, email: "" }));
                            }}
                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                              errors.email
                                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400"
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                            placeholder="Enter your Email Id"
                          />
                          {errors.email && (
                            <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors.email}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdatingProfile || !hasChanges}
                            className="flex-1 flex items-center justify-center px-4 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          >
                            {isUpdatingProfile ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Back Side - Bank Details Form */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 ${
                isFlipped ? "pointer-events-auto" : "pointer-events-none"
              }`}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full h-full">
                <BankDetailsForm
                  ref={bankDetailsRef}
                  onBack={handleBackToProfile}
                  onClose={onClose}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={handleCloseCropModal}
        imageSrc={selectedImageSrc}
        onCropComplete={handleImageUpload}
        isUploading={isUploadingImage}
      />

      {/* Remove DP Confirmation Modal */}
      {showRemoveDpConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Remove Profile Picture?
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Are you sure you want to remove your profile picture? It will
                  be replaced with the default image.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                onClick={() => setShowRemoveDpConfirm(false)}
                disabled={isUploadingImage}
                className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveDP}
                disabled={isUploadingImage}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    <span>Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Are you sure you want to logout?
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  You will need to sign in again to access your account.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddressListModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={addresses}
        isLoading={isLoadingAddresses}
        onAdd={handleAddAddress}
        onUpdate={handleUpdateAddress}
        onDelete={handleDeleteAddress}
        userName={user?.fullname}
        userPhone={user?.phone}
      />

      {/* Offer Letter Modal */}
      <OfferLetterModal
        isOpen={showOfferLetterModal}
        onClose={() => {
          setShowOfferLetterModal(false);
          setSelectedMemberForOffer(null);
        }}
        member={selectedMemberForOffer}
      />
    </>
  );
};

export default EditProfileModal;
