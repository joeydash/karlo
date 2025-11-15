import React, { useState, useEffect, useCallback, useRef } from "react";
import { Phone, Fingerprint, Loader2 } from "lucide-react";

interface CountryCode {
  code: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
];

interface EnhancedPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onPhoneCodeChange: (code: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  autoTriggerPasskey?: boolean;
  skipPasskeyCheck?: boolean;
  onPasskeyLogin?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  checkPasskeyAvailability?: (
    phone: string
  ) => Promise<{ hasPasskey: boolean }>;
  phoneCode?: string;
}

export function EnhancedPhoneInput({
  value,
  onChange,
  onPhoneCodeChange,
  disabled = false,
  isLoading = false,
  autoTriggerPasskey = false,
  skipPasskeyCheck = false,
  onPasskeyLogin,
  onKeyDown,
  checkPasskeyAvailability,
  phoneCode = "+91",
}: EnhancedPhoneInputProps) {
  const [selectedCode, setSelectedCode] = useState(phoneCode);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [checkingPasskey, setCheckingPasskey] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Update selected code when prop changes
  useEffect(() => {
    setSelectedCode(phoneCode);
  }, [phoneCode]);

  // Check passkey availability with debounce
  useEffect(() => {
    if (skipPasskeyCheck || !checkPasskeyAvailability) {
      setHasPasskey(false);
      return;
    }

    if (value.length === 10) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(async () => {
        setCheckingPasskey(true);
        try {
          const fullPhone = `${selectedCode}${value}`;
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
  }, [value, selectedCode, skipPasskeyCheck, checkPasskeyAvailability]);

  // Auto-trigger passkey login
  useEffect(() => {
    if (autoTriggerPasskey && hasPasskey && onPasskeyLogin) {
      handlePasskeyLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTriggerPasskey, hasPasskey]);

  const handleCodeChange = useCallback(
    (code: string) => {
      setSelectedCode(code);
      onPhoneCodeChange(code);
    },
    [onPhoneCodeChange]
  );

  const handlePasskeyLogin = async () => {
    if (!onPasskeyLogin) return;
    setPasskeyLoading(true);
    try {
      await onPasskeyLogin();
    } catch (error) {
      console.error("Passkey login failed:", error);
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="relative">
          <select
            value={selectedCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            disabled={disabled || isLoading}
            className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3.5 text-white font-medium cursor-pointer hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Country code"
          >
            {COUNTRY_CODES.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="bg-gray-900"
              >
                {country.flag} {country.code}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            value={value}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 10) onChange(val);
            }}
            onKeyDown={onKeyDown}
            disabled={disabled || isLoading}
            placeholder="Phone number"
            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={10}
            aria-label="Phone number"
          />
          {checkingPasskey && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Passkey Login Button */}
      {hasPasskey && !skipPasskeyCheck && (
        <button
          onClick={handlePasskeyLogin}
          disabled={disabled || isLoading || passkeyLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label="Sign in with passkey"
        >
          {passkeyLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Fingerprint className="w-5 h-5" />
          )}
          {passkeyLoading ? "Authenticating..." : "Sign in with Passkey"}
        </button>
      )}
    </div>
  );
}
