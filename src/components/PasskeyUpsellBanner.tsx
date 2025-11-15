import React, { useState, useEffect } from "react";
import { Fingerprint, Shield, X, Zap, Smartphone } from "lucide-react";
import { usePasskey } from "../hooks/usePasskey";
import { generatePasskeyName } from "../utils/generatePasskeyNames";
import toast from "react-hot-toast";

interface PasskeyUpsellBannerProps {
  userPhone: string;
  onDismiss?: () => void;
}

export const PasskeyUpsellBanner: React.FC<PasskeyUpsellBannerProps> = ({
  userPhone,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { checkPasskeyAvailability, registerPasskey } = usePasskey();

  useEffect(() => {
    const checkIfShouldShow = async () => {
      // Check if user already dismissed this banner
      const dismissed = localStorage.getItem(
        `passkey-upsell-dismissed-${userPhone}`
      );
      if (dismissed) return;

      try {
        const availability = await checkPasskeyAvailability(userPhone);
        if (!availability.hasPasskey) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Failed to check passkey availability:", error);
      }
    };

    if (userPhone) {
      checkIfShouldShow();
    }
  }, [userPhone, checkPasskeyAvailability]);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    try {
      const authToken = localStorage.getItem("auth_token");

      if (!authToken) {
        console.error("No auth token available");
        toast.error("Please log in to register a passkey");
        return;
      }

      // Try to get user_id from localStorage first, then from JWT token
      let userId = localStorage.getItem("user_id");

      if (!userId) {
        try {
          // Extract user_id from JWT token
          const tokenParts = authToken.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const hasuraClaims = payload["https://hasura.io/jwt/claims"];
            userId =
              hasuraClaims?.["x-hasura-user-id"] ||
              payload.sub ||
              payload.user_id;

            if (userId) {
              console.log(
                "[PasskeyUpsellBanner] Extracted user_id from JWT:",
                userId
              );
              // Store it for future use
              localStorage.setItem("user_id", userId);
            }
          }
        } catch (e) {
          console.error(
            "[PasskeyUpsellBanner] Could not extract user_id from JWT:",
            e
          );
        }
      }

      if (!userId) {
        console.error("No user ID available");
        toast.error("Please log in to register a passkey");
        return;
      }

      const deviceName = generatePasskeyName();
      const result = await registerPasskey(userId, authToken, deviceName);

      if (result) {
        setIsVisible(false);
        // Mark as dismissed since they've now registered
        localStorage.setItem(`passkey-upsell-dismissed-${userPhone}`, "true");
        toast.success(
          "Passkey registered successfully! You can now use it to sign in."
        );
      } else {
        // Error already handled by usePasskey hook
        toast.error("Failed to register passkey. Please try again.");
      }
    } catch (error) {
      console.error("Failed to register passkey:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register passkey";
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`passkey-upsell-dismissed-${userPhone}`, "true");
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4 mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full -ml-12 -mb-12" />

      <div className="relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          title="Dismiss banner"
          className="absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Fingerprint className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Secure Your Account with Passkey
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Skip OTP codes and sign in instantly with your fingerprint, face,
              or security key. It's more secure and convenient than passwords.
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 text-blue-500" />
                Instant login
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Shield className="w-4 h-4 text-green-500" />
                More secure
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Smartphone className="w-4 h-4 text-purple-500" />
                Works on all devices
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRegisterPasskey}
                disabled={isRegistering}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {isRegistering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    Set up Passkey
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2 px-4 text-sm transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
