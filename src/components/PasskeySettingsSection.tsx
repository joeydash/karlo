import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  Shield,
  Trash2,
  Plus,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Clock,
} from "lucide-react";
import { usePasskey } from "../hooks/usePasskey";
import { PasskeyDevice } from "../lib/passkey/passkeyApi";
import { formatDistanceToNow } from "date-fns";
import { generatePasskeyName } from "../utils/generatePasskeyNames";

interface PasskeySettingsSectionProps {
  userId: string;
  authToken: string;
  userPhone: string;
}

export const PasskeySettingsSection: React.FC<PasskeySettingsSectionProps> = ({
  userId,
  authToken,
  userPhone,
}) => {
  const [devices, setDevices] = useState<PasskeyDevice[]>([]);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [initialLoading, setInitialLoading] = useState(true);

  const {
    registerPasskey,
    listDevices,
    deleteDevice,
    loading,
    loadingDevices,
    deleting,
  } = usePasskey();

  // Load initial data
  useEffect(() => {
    const loadPasskeyData = async () => {
      try {
        console.log("[PasskeySettings] Loading devices for user:", userId);
        // Directly load devices instead of checking availability first
        const deviceList = await listDevices(userId, authToken);
        console.log("[PasskeySettings] Devices loaded:", deviceList);
        setDevices(deviceList);
        setHasPasskey(deviceList.length > 0);
      } catch (error) {
        console.error("[PasskeySettings] Failed to load passkey data:", error);
        setHasPasskey(false);
        setDevices([]);
      } finally {
        setInitialLoading(false);
      }
    };

    if (userId && authToken && userPhone) {
      loadPasskeyData();
    } else {
      console.error("[PasskeySettings] Missing required props:", {
        userId,
        authToken,
        userPhone,
      });
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authToken, userPhone]);

  const handleRegisterPasskey = async () => {
    try {
      const deviceName = await generatePasskeyName();
      const success = await registerPasskey(userId, authToken, deviceName);
      if (success) {
        setHasPasskey(true);
        // Reload devices
        const deviceList = await listDevices(userId, authToken);
        setDevices(deviceList);
      }
    } catch (error) {
      console.error("Failed to register passkey:", error);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    setDeletingDevice(deviceId);
    try {
      const success = await deleteDevice(userId, deviceId, authToken);
      if (success) {
        // Remove the device from local state
        setDevices((prevDevices) =>
          prevDevices.filter((d) => d.id !== deviceId)
        );
        // If no more devices, update hasPasskey status
        if (devices.length === 1) {
          setHasPasskey(false);
        }
      }
    } catch (error) {
      console.error("Failed to delete device:", error);
    } finally {
      setDeletingDevice(null);
      setShowDeleteConfirm(null);
    }
  };

  const getDeviceIcon = (deviceName?: string) => {
    if (!deviceName) return <Globe className="w-5 h-5" />;

    const name = deviceName.toLowerCase();
    if (
      name.includes("mobile") ||
      name.includes("phone") ||
      name.includes("android") ||
      name.includes("ios")
    ) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (name.includes("tablet") || name.includes("ipad")) {
      return <Tablet className="w-5 h-5" />;
    }
    if (
      name.includes("desktop") ||
      name.includes("computer") ||
      name.includes("windows") ||
      name.includes("mac")
    ) {
      return <Monitor className="w-5 h-5" />;
    }
    return <Globe className="w-5 h-5" />;
  };

  const formatDeviceInfo = (device: PasskeyDevice) => {
    const parts = [];
    if (device.device_id) {
      parts.push(`Device ID: ${device.device_id.slice(0, 8)}...`);
    }
    if (device.transports && device.transports.length > 0) {
      parts.push(`Transports: ${device.transports.join(", ")}`);
    }
    return parts.join(" • ") || "Passkey device";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Fingerprint className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Passkey Authentication
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Secure, passwordless authentication using your device's biometrics
          </p>
        </div>
      </div>

      {initialLoading ? (
        // Loading state
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading passkeys...
          </span>
        </div>
      ) : !hasPasskey ? (
        // No passkey setup
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Passkey Set Up
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Set up a passkey to enjoy faster, more secure logins. Use your
            fingerprint, face, or security key instead of OTP codes.
          </p>
          <button
            onClick={handleRegisterPasskey}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Set Up Passkey
              </>
            )}
          </button>
        </div>
      ) : (
        // Has passkey - show device management
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Your Devices ({devices.length})
            </h4>
            <button
              onClick={handleRegisterPasskey}
              disabled={loading}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          </div>

          {loadingDevices ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading devices...
              </span>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                No devices found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                      {getDeviceIcon(device.device_name)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {device.device_name || "Passkey Device"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDeviceInfo(device)}
                      </div>
                      {device.last_used_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          Last used{" "}
                          {formatDistanceToNow(new Date(device.last_used_at), {
                            addSuffix: true,
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {showDeleteConfirm === device.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteDevice(device.id)}
                          disabled={deletingDevice === device.id}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingDevice === device.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(device.id)}
                        disabled={deleting || devices.length === 1}
                        title={
                          devices.length === 1
                            ? "Cannot delete your only passkey device"
                            : "Remove this device"
                        }
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info section */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  About Passkeys
                </h5>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Passkeys are more secure than passwords and work across all
                  your devices. They're stored securely on your device and never
                  shared with our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
