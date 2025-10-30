import React, { useState } from 'react';
import { X, MapPin, Home, Briefcase, Hotel, MapPinned, Edit, Trash2, Plus, Loader2, Phone } from 'lucide-react';
import { Address, AddressFormData } from '../types/address';
import AddressModal from './AddressModal';
import ConfirmationModal from './ConfirmationModal';

interface AddressListModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: Address[];
  isLoading: boolean;
  onAdd: (data: AddressFormData) => Promise<void>;
  onUpdate: (id: string, data: Partial<AddressFormData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userName?: string;
  userPhone?: string;
}

const AddressListModal: React.FC<AddressListModalProps> = ({
  isOpen,
  onClose,
  addresses,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
  userName,
  userPhone,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return Home;
      case 'work':
        return Briefcase;
      case 'hotel':
        return Hotel;
      default:
        return MapPinned;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'home':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'work':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'hotel':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  };

  const handleAdd = async (data: AddressFormData) => {
    setActionLoading(true);
    try {
      await onAdd(data);
      setIsAddModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (data: AddressFormData) => {
    if (!editingAddress) return;
    setActionLoading(true);
    try {
      await onUpdate(editingAddress.id, data);
      setEditingAddress(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAddressId) return;
    setActionLoading(true);
    try {
      await onDelete(deletingAddressId);
      setDeletingAddressId(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  My Addresses
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Manage your saved addresses
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Add New Address Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all mb-4 sm:mb-6"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm sm:text-base">Add New Address</span>
            </button>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading addresses...</p>
                </div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No addresses yet</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                  Start by adding your first address to make it easier for future use
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {addresses.map((address) => {
                  const Icon = getAddressIcon(address.type);
                  const typeColor = getTypeColor(address.type);

                  return (
                    <div
                      key={address.id}
                      className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 ${typeColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white capitalize mb-0.5">
                              {address.type}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                              {address.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              {address.fhb_name}
                            </p>
                            {address.floor && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Floor: {address.floor}
                              </p>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                              {address.full_address}
                            </p>
                            {address.nearby_landmark && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Near: {address.nearby_landmark}
                              </p>
                            )}
                          </div>
                        </div>

                        {address.contact_number && (
                          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{address.contact_number}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => setEditingAddress(address)}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingAddressId(address.id)}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAdd}
        isLoading={actionLoading}
        userName={userName}
        userPhone={userPhone}
      />

      <AddressModal
        isOpen={!!editingAddress}
        onClose={() => setEditingAddress(null)}
        onSave={handleUpdate}
        editAddress={editingAddress}
        isLoading={actionLoading}
        userName={userName}
        userPhone={userPhone}
      />

      <ConfirmationModal
        isOpen={!!deletingAddressId}
        onClose={() => setDeletingAddressId(null)}
        onConfirm={handleDelete}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Delete"
        isDestructive
      />
    </>
  );
};

export default AddressListModal;
