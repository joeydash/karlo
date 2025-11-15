import React, { useState, useEffect } from "react";
import { X, Fingerprint, KeyRound, Loader2 } from "lucide-react";
import { getRecentLogins, removeRecentLogin } from "../utils/recentLogins";
import type { RecentLogin } from "../utils/recentLogins";
import { formatDistanceToNow } from "date-fns";

interface QuickLoginProps {
  onSelectPhone: (phone: string) => void;
  onSelectPhoneWithPasskey?: (phone: string) => void;
  onForceOTP?: (phone: string) => void;
  checkPasskeyAvailability?: (
    phone: string
  ) => Promise<{ hasPasskey: boolean }>;
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
      onSelectPhoneWithPasskey(selectedLogin.phone);
    }
    setShowMethodModal(false);
    setSelectedLogin(null);
  };

  const handleUseOTP = () => {
    if (selectedLogin && onForceOTP) {
      onForceOTP(selectedLogin.phone);
    }
    setShowMethodModal(false);
    setSelectedLogin(null);
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

  if (recentLogins.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-white/70 text-sm font-medium">Quick Login</h3>
        <div className="space-y-2">
          {recentLogins.map((login) => {
            const fullPhone = `${login.phoneCode}${login.phone}`;
            const isChecking = checkingPasskey === fullPhone;
            const displayName = getDisplayName(login);
            const initials = getInitials(displayName);

            return (
              <button
                key={fullPhone}
                onClick={() => handleLoginClick(login)}
                disabled={disabled || isChecking}
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all text-left flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {isChecking ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {displayName}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {login.userName && login.userName !== fullPhone
                      ? fullPhone
                      : ""}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    Last login{" "}
                    {formatDistanceToNow(new Date(login.lastLogin), {
                      addSuffix: true,
                    })}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => handleRemove(e, login.phone, login.phoneCode)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* Method Choice Modal */}
      {showMethodModal && selectedLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-white/10 max-w-md w-full">
            <h3 className="text-white text-xl font-semibold mb-2">
              Choose Login Method
            </h3>
            <p className="text-gray-400 mb-6">
              How would you like to sign in to {getDisplayName(selectedLogin)}?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleUsePasskey}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                Use Passkey
              </button>

              <button
                onClick={handleUseOTP}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-5 h-5" />
                Use OTP
              </button>

              <button
                onClick={() => {
                  setShowMethodModal(false);
                  setSelectedLogin(null);
                }}
                className="w-full text-gray-400 hover:text-white py-2 transition-all"
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
