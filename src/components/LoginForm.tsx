import React, { useState, useRef, useEffect } from 'react';
import { Square, Shield, Loader2, Check, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AUTH_CONFIG } from '../utils/config';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { requestOTP, verifyOTP, isRequestingOTP, isVerifyingOTP, error, clearError } = useAuth();

  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  useEffect(() => {
    if (error) {
      if (step === 'phone') {
        setPhoneError(error);
      } else {
        setOtpError(error);
      }
      clearError();
    }
  }, [error, step, clearError]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
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
    setPhoneError('');

    if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    const fullPhone = `+91${phone}`;
    const result = await requestOTP(fullPhone);
    
    if (result.success) {
      setStep('otp');
    } else {
      setPhoneError(result.message || 'Failed to send OTP');
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otp.length !== AUTH_CONFIG.OTP_LENGTH) {
      setOtpError(`Please enter a ${AUTH_CONFIG.OTP_LENGTH}-digit OTP`);
      return;
    }

    const fullPhone = `+91${phone}`;
    const result = await verifyOTP(fullPhone, otp);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setOtpError(result.message || 'Invalid OTP');
    }
  };

  const handleOTPDigitChange = (index: number, digit: string) => {
    if (!/^[0-9]?$/.test(digit)) return; // Only digits
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);
    
    // Update the combined OTP value
    const newOtp = newOtpDigits.join('');
    setOtp(newOtp);
    setOtpError('');
    
    // Auto-focus next input
    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: clear current and move to previous
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtpDigits = pastedData.split('');
      setOtpDigits(newOtpDigits);
      setOtp(pastedData);
      setOtpError('');
      
      // Focus the last input
      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5]?.focus();
      }
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20 dark:border-gray-600/20 transition-colors duration-200">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6 shadow-lg">
            <img
              src="/icons/web-app-manifest-192x192.png"
              alt="One Platform Logo"
              className="w-full h-full rounded-xl sm:rounded-2xl object-cover"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
            Welcome!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-2">
            {step === 'phone' 
              ? 'Enter your phone number to receive a secure verification code'
              : `We've sent a 6-digit verification code to +91${phone}`
            }
          </p>
        </div>

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">+91</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhoneNumber(e.target.value));
                    setPhoneError('');
                  }}
                  className={`block w-full pl-14 pr-4 py-3 sm:py-4 text-base border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    phoneError 
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                      : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                  placeholder="9876543210"
                  maxLength="10"
                />
              </div>
              {phoneError && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {phoneError}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isRequestingOTP || phone.length !== 10}
              className="w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-lg text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isRequestingOTP ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleOTPSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Verification Code
              </label>
              <div className="flex gap-2 sm:gap-3 justify-center mb-3 sm:mb-4">
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
                    className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                      otpError 
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  />
                ))}
              </div>
              {otpError && (
                <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {otpError}
                </div>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              <button
                type="submit"
                disabled={isVerifyingOTP || otp.length !== 6}
                className="w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-lg text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isVerifyingOTP ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Verify Code
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToPhone}
                className="w-full py-2.5 sm:py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                Change Mobile Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginForm;