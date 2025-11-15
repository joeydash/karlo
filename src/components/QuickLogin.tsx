import React, { useState, useEffect } from "react";
import { X, Fingerprint, KeyRound, Loader2, User } from "lucide-react";
import { getRecentLogins, removeRecentLogin } from "../utils/recentLogins";
import type { RecentLogin } from "../utils/recentLogins";
import { formatDistanceToNow } from "date-fns";
import type { AuthenticationOptions } from "../lib/passkey/passkeyApi";

interface QuickLoginProps {
  onSelectPhone: (phone: string) => void;
  onSelectPhoneWithPasskey?: (
    phone: string,
    options?: AuthenticationOptions
  ) => void;
  onForceOTP?: (phone: string) => void;
  checkPasskeyAvailability?: (
    phone: string
  ) => Promise<{ hasPasskey: boolean; options?: AuthenticationOptions }>;
  disabled?: boolean;
}

export function QuickLogin({
  onSelectPhone,
  onSelectPhoneWithPasskey,
  onForceOTP,
  checkPasskeyAvailability,
  disabled = false,
}: QuickLoginProps) {
  const [recentLogins, setRecentLogins] = useState<RecentLogin[]>([]);
  const [checkingPasskey, setCheckingPasskey] = useState<string | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [selectedLogin, setSelectedLogin] = useState<RecentLogin | null>(null);
  const [cachedOptions, setCachedOptions] =
    useState<AuthenticationOptions | null>(null);

  useEffect(() => {
    loadRecentLogins();
  }, []);

  const loadRecentLogins = () => {
    const logins = getRecentLogins();
    setRecentLogins(logins);
  };

  const handleRemove = (
    e: React.MouseEvent,
    phone: string,
    phoneCode: string
  ) => {
    e.stopPropagation();
    removeRecentLogin(phone, phoneCode);
    loadRecentLogins();
  };

  const handleLoginClick = async (login: RecentLogin) => {
    if (disabled) return;

    const fullPhone = `${login.phoneCode}${login.phone}`;

    // Check passkey availability first
    if (checkPasskeyAvailability) {
      setCheckingPasskey(fullPhone);
      try {
        const result = await checkPasskeyAvailability(fullPhone);
        if (result.hasPasskey) {
          // Cache the options to reuse the same challenge
          setCachedOptions(result.options || null);
          // Show modal with passkey/OTP choice
          setSelectedLogin(login);
          setShowMethodModal(true);
        } else {
          // No passkey, directly send OTP
          if (onForceOTP) {
            onForceOTP(login.phone);
          } else {
            onSelectPhone(login.phone);
          }
        }
      } catch (error) {
        console.error("Error checking passkey:", error);
        onSelectPhone(login.phone);
      } finally {
        setCheckingPasskey(null);
      }
    } else {
      onSelectPhone(login.phone);
    }
  };

  const handleUsePasskey = () => {
    if (selectedLogin && onSelectPhoneWithPasskey) {
      onSelectPhoneWithPasskey(selectedLogin.phone, cachedOptions || undefined);
    }
    setShowMethodModal(false);
    setSelectedLogin(null);
    setCachedOptions(null);
  };

  const handleUseOTP = () => {
    if (selectedLogin && onForceOTP) {
      onForceOTP(selectedLogin.phone);
    }
    setShowMethodModal(false);
    setSelectedLogin(null);
    setCachedOptions(null);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getDisplayName = (login: RecentLogin) => {
    if (
      login.userName &&
      login.userName !== `${login.phoneCode}${login.phone}`
    ) {
      return login.userName;
    }
    return `${login.phoneCode} ${login.phone}`;
  };

  const hasUserName = (login: RecentLogin) => {
    return (
      login.userName && login.userName !== `${login.phoneCode}${login.phone}`
    );
  };

  if (recentLogins.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Quick Login</h3>
        </div>

        <div className="space-y-2">
          {recentLogins.map((login) => {
            const fullPhone = `${login.phoneCode}${login.phone}`;
            const isChecking = checkingPasskey === fullPhone;
            const displayName = getDisplayName(login);
            const initials = getInitials(displayName);
            const showUserName = hasUserName(login);

            return (
              <button
                key={fullPhone}
                onClick={() => handleLoginClick(login)}
                disabled={disabled || isChecking}
                className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {isChecking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : showUserName ? (
                      initials
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-grow text-left min-w-0">
                    <div className="text-white font-medium truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {login.userName && login.userName !== fullPhone && (
                        <span className="mr-2">{fullPhone}</span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(login.lastLogin), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={(e) =>
                        handleRemove(e, login.phone, login.phoneCode)
                      }
                      className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      title="Remove from quick login"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 text-center">
            Or enter a phone number below
          </p>
        </div>
      </div>

      {/* Login Method Choice Dialog */}
      {showMethodModal && selectedLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Choose Login Method
            </h3>
            <p className="text-gray-300 text-sm mb-6">
              How would you like to sign in as{" "}
              <span className="font-medium text-white">
                {getDisplayName(selectedLogin)}
              </span>
              ?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleUsePasskey}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <Fingerprint className="w-5 h-5" />
                Use Passkey
              </button>
              <button
                onClick={handleUseOTP}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <KeyRound className="w-5 h-5" />
                Use OTP
              </button>
              <button
                onClick={() => {
                  setShowMethodModal(false);
                  setSelectedLogin(null);
                }}
                className="w-full text-gray-400 hover:text-white text-sm py-2 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
