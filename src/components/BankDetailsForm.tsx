import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Loader2, AlertCircle, CheckCircle, Building2, User, Hash, Shield, Edit, IndianRupee, Plus, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

interface BankDetailsFormProps {
  onBack: () => void;
  onClose: () => void;
  ref?: React.Ref<{ loadBankDetails: () => Promise<void> }>;
}

const BankDetailsForm = React.forwardRef<{ loadBankDetails: () => Promise<void> }, BankDetailsFormProps>(({ onBack, onClose }, ref) => {
  const { updateBankDetails, fetchBankDetails } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountName: ''
  });
  const [currentBankDetails, setCurrentBankDetails] = useState<any>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Expose loadBankDetails function to parent component
  React.useImperativeHandle(ref, () => ({
    loadBankDetails
  }), []);

  const loadBankDetails = async () => {
    setIsLoading(true);
    const result = await fetchBankDetails();
    setIsLoading(false);

    if (result.success && result.data) {
      setCurrentBankDetails(result.data);
      setFormData({
        accountNumber: result.data.bank_account_number || '',
        confirmAccountNumber: result.data.bank_account_number || '',
        ifscCode: result.data.ifsc || '',
        accountName: result.data.account_name || '',
      });
    } else if (result.message && result.message !== 'Not authenticated') {
      showError('Failed to load bank details', result.message);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(formData.accountNumber.replace(/\s/g, ''))) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    if (!formData.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = 'Please confirm your account number';
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Please enter a valid IFSC code (e.g., SBIN0001234)';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account holder name is required';
    } else if (formData.accountName.trim().length < 2) {
      newErrors.accountName = 'Account holder name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Show verification step before updating
    setShowVerification(true);
  };

  const handleConfirmUpdate = async () => {
    setIsUpdating(true);

    try {
      const result = await updateBankDetails({
        bank_account_number: formData.accountNumber,
        ifsc: formData.ifscCode.toUpperCase(),
        account_name: formData.accountName.trim()
      });

      if (result.success) {
        // Reset states and go back to view mode
        setShowVerification(false);
        setShowEditForm(false);
        setErrors({});
        
        // Reload bank details to show updated information
        await loadBankDetails();
        
        showSuccess('Bank details updated', 'Your banking information has been updated successfully');
      } else {
        setErrors({ accountNumber: result.message || 'Failed to update bank details' });
        showError('Update failed', result.message || 'Failed to update bank details. Please try again.');
        setShowVerification(false);
      }
      
    } catch (error) {
      console.error('Error updating bank details:', error);
      setErrors({ accountNumber: 'Failed to update bank details. Please try again.' });
      showError('Update failed', 'An unexpected error occurred. Please try again.');
      setShowVerification(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatAccountNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Add spaces every 4 digits for better readability
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, accountNumber: cleaned }));
    if (errors.accountNumber) setErrors(prev => ({ ...prev, accountNumber: '' }));
  };

  const handleConfirmAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, confirmAccountNumber: cleaned }));
    if (errors.confirmAccountNumber) setErrors(prev => ({ ...prev, confirmAccountNumber: '' }));
  };

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setErrors({});
    // Reset form data to current bank details
    if (currentBankDetails) {
      setFormData({
        accountNumber: currentBankDetails.bank_account_number || '',
        confirmAccountNumber: currentBankDetails.bank_account_number || '',
        ifscCode: currentBankDetails.ifsc || '',
        accountName: currentBankDetails.account_name || '',
      });
    }
  };

  // Check if there are any changes
  const hasChanges = currentBankDetails ? (
    formData.accountNumber !== (currentBankDetails.bank_account_number || '') ||
    formData.ifscCode.toUpperCase() !== (currentBankDetails.ifsc || '') ||
    formData.accountName.trim() !== (currentBankDetails.account_name || '')
  ) : true; // If no current bank details, always allow submission (new entry)

  // Verification Modal
  if (showVerification) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Bank Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Please verify your information before updating</p>
            </div>
          </div>
          <button
            onClick={() => setShowVerification(false)}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 disabled:opacity-50"
          >
            <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bank-details-scroll p-6 space-y-6">
          {/* Current Details (if any) */}
          {currentBankDetails && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current Bank Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                  <span className="font-mono text-gray-900 dark:text-white">****{currentBankDetails.bank_account_number.slice(-4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{currentBankDetails.ifsc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                  <span className="text-gray-900 dark:text-white">{currentBankDetails.account_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* New Details */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Bank Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                <span className="font-mono text-gray-900 dark:text-white">{formatAccountNumber(formData.accountNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                <span className="font-mono text-gray-900 dark:text-white">{formData.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                <span className="text-gray-900 dark:text-white">{formData.accountName}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">Important Notice</p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Please ensure all details are correct. Incorrect bank details may cause payment delays or failures.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowVerification(false)}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleConfirmUpdate}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Update
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Form View
  if (showEditForm) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancelEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 mr-2"
            >
              <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Edit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Bank Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Update your banking information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto bank-details-scroll p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warning Notice */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 text-red-800 dark:text-red-300">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Important Warning</p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Please double-check all bank details before updating. Incorrect information may cause payment delays or failures. Ensure the account number, IFSC code, and account holder name exactly match your bank records.
              </p>
            </div>

            {/* Account Number (Masked) */}
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="h-4 w-4 inline mr-1" />
                Account Number *
              </label>
              <input
                id="accountNumber"
                type="password"
                value={formData.accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-mono ${
                  errors.accountNumber ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="Enter your account number"
                maxLength="18"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Account number is masked for security</p>
              {errors.accountNumber && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.accountNumber}
                </div>
              )}
            </div>

            {/* Confirm Account Number */}
            <div>
              <label htmlFor="confirmAccountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                Confirm Account Number *
              </label>
              <input
                id="confirmAccountNumber"
                type="text"
                value={formatAccountNumber(formData.confirmAccountNumber)}
                onChange={(e) => handleConfirmAccountNumberChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-mono ${
                  errors.confirmAccountNumber ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="1234 5678 9012 3456"
                maxLength="23" // 18 digits + 4 spaces
              />
              {errors.confirmAccountNumber && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmAccountNumber}
                </div>
              )}
            </div>

            {/* IFSC Code */}
            <div>
              <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                IFSC Code *
              </label>
              <input
                id="ifscCode"
                type="text"
                value={formData.ifscCode}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }));
                  if (errors.ifscCode) setErrors(prev => ({ ...prev, ifscCode: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-mono ${
                  errors.ifscCode ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="SBIN0001234"
                maxLength="11"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.ifscCode && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.ifscCode}
                </div>
              )}
            </div>

            {/* Account Holder Name */}
            <div>
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Account Holder Name *
              </label>
              <input
                id="accountName"
                type="text"
                value={formData.accountName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, accountName: e.target.value }));
                  if (errors.accountName) setErrors(prev => ({ ...prev, accountName: '' }));
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.accountName ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="Enter account holder name as per bank records"
              />
              {errors.accountName && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.accountName}
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Secure & Encrypted</p>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Your banking information is encrypted and stored securely. We never store your complete account details in plain text.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!hasChanges}
              className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Update Bank Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View Mode (Default)
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 mr-2"
          >
            <ArrowLeft className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <IndianRupee className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Details</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">View your banking information</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
        >
          <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bank-details-scroll p-6">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32 mb-3"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
                </div>
              ))}
            </div>
          </div>
        ) : currentBankDetails ? (
          <div className="space-y-6">
            {/* Bank Details Display */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Current Bank Details
              </h3>
              
              <div className="space-y-4">
                {/* Account Number */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <Hash className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account Number</span>
                  </div>
                  <p className="text-lg font-mono text-gray-900 dark:text-white">
                    ****{currentBankDetails.bank_account_number.slice(-4)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Last 4 digits shown for security</p>
                </div>

                {/* IFSC Code */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">IFSC Code</span>
                  </div>
                  <p className="text-lg font-mono text-gray-900 dark:text-white">{currentBankDetails.ifsc}</p>
                </div>

                {/* Account Holder Name */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account Holder Name</span>
                  </div>
                  <p className="text-lg text-gray-900 dark:text-white">{currentBankDetails.account_name}</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-300">
                <Shield className="h-5 w-5" />
                <p className="text-sm font-medium">Secure & Encrypted</p>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Your banking information is encrypted and stored securely. We never store your complete account details in plain text.
              </p>
            </div>
          </div>
        ) : (
          /* No Bank Details */
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bank details found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Add your banking information to receive payments</p>
            <button
              onClick={handleEditClick}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Add Bank Details</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer - Only show edit button if bank details exist */}
      {currentBankDetails && !isLoading && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <button
            onClick={handleEditClick}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Bank Details</span>
          </button>
        </div>
      )}
    </div>
  );
});

export default BankDetailsForm;