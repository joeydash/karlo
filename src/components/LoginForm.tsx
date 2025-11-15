import React, { useState, useRef, useEffect } from "react";
import { Loader2, AlertCircle, Lock, Fingerprint } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePasskey } from "../hooks/usePasskey";
import { AUTH_CONFIG } from "../utils/config";
import { QuickLogin } from "./QuickLogin";
import {
  isLoginSaved,
  addRecentLogin,
  getRecentLogins,
} from "../utils/recentLogins";
import toast from "react-hot-toast";
import useAuthStore from "../stores/authStore";
import type { AuthenticationOptions } from "../lib/passkey/passkeyApi";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [hasPasskey, setHasPasskey] = useState(false);
  const [checkingPasskey, setCheckingPasskey] = useState(false);
  const [skipPasskeyCheck, setSkipPasskeyCheck] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const {
    requestOTP,
    verifyOTP,
    isRequestingOTP,
    isVerifyingOTP,
    error,
    clearError,
    completePasskeyLogin,
  } = useAuth();
  const { loginWithPasskey, checkPasskeyAvailability } = usePasskey();
  const authUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (step === "otp" && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  useEffect(() => {
    if (error) {
      if (step === "phone") {
        setPhoneError(error);
      } else {
        setOtpError(error);
      }
      clearError();
    }
  }, [error, step, clearError]);

  // Check passkey availability with debounce
  useEffect(() => {
    // Skip check if coming from quick login (already checked)
    if (skipPasskeyCheck) {
      setSkipPasskeyCheck(false);
      return;
    }

    if (phone.length === 10) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setCheckingPasskey(true);
        try {
          const fullPhone = `+91${phone}`;
          const result = await checkPasskeyAvailability(fullPhone);
          setHasPasskey(result.hasPasskey);
        } catch (error) {
          console.error("Error checking passkey:", error);
          setHasPasskey(false);
        } finally {
          setCheckingPasskey(false);
        }
      }, 500);
    } else {
      setHasPasskey(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [phone, checkPasskeyAvailability]);

  // Auto-submit OTP when complete
  useEffect(() => {
    if (otp.length === 6 && step === "otp" && !isVerifyingOTP) {
      handleOTPSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step, isVerifyingOTP]);

  const promptSaveForQuickLogin = (userName?: string) => {
    if (isLoginSaved(phone, "+91")) return;

    toast.custom(
      (t: { id: string }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Save for Quick Login?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save this account to access it quickly next time without
                entering your phone number
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                addRecentLogin(phone, "+91", userName);
                toast.dismiss(t.id);
                toast.success("✓ Account saved successfully", {
                  style: {
                    background: "#10b981",
                    color: "#fff",
                  },
                });
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-purple-500/20"
            >
              Save Account
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all"
            >
              Not Now
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
  };

  const getUserName = () => {
    // Try to get username from Zustand store first (most up-to-date)
    if (authUser?.fullname) {
      return authUser.fullname;
    }
    // Fallback to localStorage (set by auth store after profile fetch)
    const storedUserName = localStorage.getItem("user_name");
    if (storedUserName && storedUserName !== `+91${phone}`) {
      return storedUserName;
    }
    return `+91${phone}`;
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.slice(0, 10);
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const fullPhone = `+91${phoneNumber}`;
    return AUTH_CONFIG.PHONE_REGEX.test(fullPhone);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid 10-digit mobile number");
      return;
    }

    const fullPhone = `+91${phone}`;
    const result = await requestOTP(fullPhone);

    if (result.success) {
      setStep("otp");
    } else {
      setPhoneError(result.message || "Failed to send OTP");
    }
  };

  const handleOTPSubmit = async () => {
    setOtpError("");

    if (otp.length !== AUTH_CONFIG.OTP_LENGTH) {
      setOtpError(`Please enter a ${AUTH_CONFIG.OTP_LENGTH}-digit OTP`);
      return;
    }

    const fullPhone = `+91${phone}`;
    const result = await verifyOTP(fullPhone, otp);

    if (result.success) {
      // Wait a bit for profile to be fetched by auth store
      await new Promise((resolve) => setTimeout(resolve, 300));

      const userName = getUserName();
      localStorage.setItem("user_name", userName);
      promptSaveForQuickLogin(userName);
      onSuccess?.();
    } else {
      setOtpError(result.message || "Invalid OTP");
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      const fullPhone = `+91${phone}`;
      const result = await loginWithPasskey(fullPhone);

      if (result) {
        // Use auth store to complete login and fetch profile
        await completePasskeyLogin(
          fullPhone,
          result.auth_token,
          result.refresh_token,
          result.id
        );

        const userName = getUserName();
        localStorage.setItem("user_name", userName);
        promptSaveForQuickLogin(userName);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Passkey login failed:", error);
      setPhoneError("Passkey authentication failed. Please try OTP.");
    }
  };

  const handleSelectPhoneWithPasskey = async (
    selectedPhone: string,
    options?: AuthenticationOptions
  ) => {
    // Set phone and skip the automatic passkey check
    setPhone(selectedPhone);
    setSkipPasskeyCheck(true);

    // Directly execute passkey login with cached options
    setTimeout(async () => {
      try {
        const fullPhone = `+91${selectedPhone}`;
        // Pass cached options to reuse the same challenge
        const result = await loginWithPasskey(fullPhone, options);

        if (result) {
          // Use auth store to complete login and fetch profile
          await completePasskeyLogin(
            fullPhone,
            result.auth_token,
            result.refresh_token,
            result.id
          );

          const userName = getUserName();
          localStorage.setItem("user_name", userName);
          onSuccess?.();
        }
      } catch (error) {
        console.error("Passkey login failed:", error);
        toast.error("Passkey authentication failed");
      }
    }, 100);
  };

  const handleForceOTP = async (selectedPhone: string) => {
    // Set phone and skip the automatic passkey check
    setPhone(selectedPhone);
    setSkipPasskeyCheck(true);

    // Directly send OTP
    setTimeout(async () => {
      const fullPhone = `+91${selectedPhone}`;
      const result = await requestOTP(fullPhone);

      if (result.success) {
        setStep("otp");
      } else {
        setPhoneError(result.message || "Failed to send OTP");
      }
    }, 100);
  };

  const handleOTPDigitChange = (index: number, digit: string) => {
    if (!/^[0-9]?$/.test(digit)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);

    const newOtp = newOtpDigits.join("");
    setOtp(newOtp);
    setOtpError("");

    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (
      e.key === "Backspace" &&
      !otpDigits[index] &&
      index > 0 &&
      otpInputRefs.current[index - 1]
    ) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length === 6) {
      const newOtpDigits = pastedData.split("");
      setOtpDigits(newOtpDigits);
      setOtp(pastedData);
      setOtpError("");

      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5]?.focus();
      }
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtp("");
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
  };

  return (
    <div className="w-full max-w-md bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex justify-center mb-4">
        <img
          src="/icons/web-app-manifest-192x192.png"
          alt="Logo"
          className="h-16 w-auto"
        />
      </div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-300">
          {step === "phone"
            ? "Enter your phone number to get started"
            : "Enter the OTP sent to your phone"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Phone Step */}
        {step === "phone" && (
          <>
            {/* Quick Login */}
            {getRecentLogins().length > 0 && (
              <QuickLogin
                onSelectPhone={(p) => setPhone(p)}
                onSelectPhoneWithPasskey={handleSelectPhoneWithPasskey}
                onForceOTP={handleForceOTP}
                checkPasskeyAvailability={checkPasskeyAvailability}
                disabled={isRequestingOTP}
              />
            )}

            {/* Phone Input */}
            <div className="space-y-3">
              <div className="relative flex">
                <div className="relative">
                  <div className="h-full px-3 py-3 border border-r-0 border-gray-300/20 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/5 backdrop-blur-sm text-white flex items-center gap-2 min-w-[100px] justify-center font-medium">
                    +91
                  </div>
                </div>

                <input
                  type="tel"
                  className="block w-full pl-4 pr-10 py-3 border border-gray-300/20 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/5 backdrop-blur-sm text-white placeholder-gray-300/80 font-medium"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhoneNumber(e.target.value));
                    setPhoneError("");
                  }}
                  disabled={isRequestingOTP}
                  maxLength={10}
                />

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {checkingPasskey ? (
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {phoneError && (
                <div className="flex items-center text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {phoneError}
                </div>
              )}

              {/* Passkey Login Option */}
              {hasPasskey && (
                <button
                  onClick={handlePasskeyLogin}
                  disabled={isRequestingOTP}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {isRequestingOTP ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5" />
                      Sign in with Passkey
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              disabled={isRequestingOTP || phone.length !== 10}
              className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRequestingOTP ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </button>
          </>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <>
            <div className="flex gap-2 justify-center mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={otpDigits[index]}
                  onChange={(e) => handleOTPDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  onPaste={handleOTPPaste}
                  aria-label={`OTP digit ${index + 1}`}
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/5 backdrop-blur-sm text-white transition-all"
                />
              ))}
            </div>
            {otpError && (
              <div className="mb-4 flex items-center justify-center text-sm text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {otpError}
              </div>
            )}
            <button
              onClick={() => handleOTPSubmit()}
              disabled={isVerifyingOTP || otp.length !== 6}
              className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifyingOTP ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </button>
            <button
              onClick={handleBackToPhone}
              className="w-full text-gray-300 hover:text-white text-sm"
            >
              Change Phone Number
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
