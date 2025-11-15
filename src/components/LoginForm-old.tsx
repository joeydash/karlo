import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Check, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePasskey } from '../hooks/usePasskey';
import { AUTH_CONFIG } from '../utils/config';
import { EnhancedPhoneInput } from './EnhancedPhoneInput';
import { QuickLogin } from './QuickLogin';
import { isLoginSaved, addRecentLogin } from '../utils/recentLogins';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [autoTriggerPasskey, setAutoTriggerPasskey] = useState(false);
  const [skipPasskeyCheck, setSkipPasskeyCheck] = useState(false);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { requestOTP, verifyOTP, isRequestingOTP, isVerifyingOTP, error, clearError } = useAuth();
  const { loginWithPasskey, checkPasskeyAvailability } = usePasskey();

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

  // Auto-submit OTP when complete
  useEffect(() => {
    if (otp.length === 6 && step === 'otp' && !isVerifyingOTP) {
      handleOTPSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step, isVerifyingOTP]);

  const promptSaveForQuickLogin = (userName?: string) => {
    if (isLoginSaved(phone, phoneCode)) return;

    toast.custom((t: { id: string }) => (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 shadow-2xl border border-white/10">
        <p className="text-white mb-3">Save this account for quick login?</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              addRecentLogin(phone, phoneCode, userName);
              toast.dismiss(t.id);
              toast.success('Saved for quick login');
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
          >
            Save
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            Not Now
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const getUserProfile = async (authToken: string, fullPhone: string) => {
    try {
      // TODO: Replace with actual API call to fetch user profile
      // This is a placeholder - implement based on your API
      const response = await fetch(`${import.meta.env.VITE_GRAPHQL_ENDPOINT}/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ phone: fullPhone })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  const handlePhoneSubmit = async () => {
    setPhoneError('');

    if (phone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    const fullPhone = `${phoneCode}${phone}`;
    const result = await requestOTP(fullPhone);
    
    if (result.success) {
      setStep('otp');
      setSkipPasskeyCheck(false);
    } else {
      setPhoneError(result.message || 'Failed to send OTP');
    }
  };

  const handleOTPSubmit = async () => {
    setOtpError('');

    if (otp.length !== AUTH_CONFIG.OTP_LENGTH) {
      setOtpError(`Please enter a ${AUTH_CONFIG.OTP_LENGTH}-digit OTP`);
      return;
    }

    const fullPhone = `${phoneCode}${phone}`;
    const result = await verifyOTP(fullPhone, otp);
    
    if (result.success) {
      // Fetch user profile to get name
      const authToken = localStorage.getItem('auth_token');
      let userName = fullPhone;
      
      if (authToken) {
        const userProfile = await getUserProfile(authToken, fullPhone);
        
        if (userProfile) {
          // Priority: fullname > username > phone
          if (userProfile.fullname?.trim()) {
            userName = userProfile.fullname.trim();
          } else if (userProfile.username?.trim()) {
            userName = userProfile.username.trim();
          }
        }
      }
      
      localStorage.setItem('user_name', userName);
      
      // Prompt to save for quick login
      promptSaveForQuickLogin(userName);
      
      onSuccess?.();
    } else {
      setOtpError(result.message || 'Invalid OTP');
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      const fullPhone = `${phoneCode}${phone}`;
      const result = await loginWithPasskey(fullPhone);
      
      if (result) {
        localStorage.setItem('auth_token', result.auth_token);
        localStorage.setItem('refresh_token', result.refresh_token);
        localStorage.setItem('user_id', result.id);
        
        // Fetch user profile to get name
        let userName = fullPhone;
        const userProfile = await getUserProfile(result.auth_token, fullPhone);
        
        if (userProfile) {
          if (userProfile.fullname?.trim()) {
            userName = userProfile.fullname.trim();
          } else if (userProfile.username?.trim()) {
            userName = userProfile.username.trim();
          }
        }
        
        localStorage.setItem('user_name', userName);
        
        // Prompt to save for quick login
        promptSaveForQuickLogin(userName);
        
        onSuccess?.();
      }
    } catch (error) {
      console.error('Passkey login failed:', error);
      setPhoneError('Passkey authentication failed. Please try OTP.');
    }
  };

  const handleSelectPhoneWithPasskey = async (selectedPhone: string, selectedCode: string) => {
    setPhone(selectedPhone);
    setPhoneCode(selectedCode);
    setAutoTriggerPasskey(true);
    setSkipPasskeyCheck(true);
    setTimeout(() => setAutoTriggerPasskey(false), 2000);
  };

  const handleForceOTP = async (selectedPhone: string, selectedCode: string) => {
    setPhone(selectedPhone);
    setPhoneCode(selectedCode);
    setSkipPasskeyCheck(true);
    
    // Send OTP
    const fullPhone = `${selectedCode}${selectedPhone}`;
    const result = await requestOTP(fullPhone);
    
    if (result.success) {
      setStep('otp');
    } else {
      setPhoneError(result.message || 'Failed to send OTP');
    }
    
    setSkipPasskeyCheck(false);
  };

  const handleOTPDigitChange = (index: number, digit: string) => {
    if (!/^[0-9]?$/.test(digit)) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);
    
    const newOtp = newOtpDigits.join('');
    setOtp(newOtp);
    setOtpError('');
    
    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
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
              ? 'Enter your phone number to continue'
              : `We've sent a 6-digit verification code to ${phoneCode}${phone}`
            }
          </p>
        </div>

        {/* Phone Step */}
        {step === 'phone' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Quick Login */}
            <QuickLogin
              onSelectPhone={(p, c) => {
                setPhone(p);
                setPhoneCode(c);
              }}
              onSelectPhoneWithPasskey={handleSelectPhoneWithPasskey}
              onForceOTP={handleForceOTP}
              checkPasskeyAvailability={checkPasskeyAvailability}
              disabled={isRequestingOTP}
            />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                  Or enter phone number
                </span>
              </div>
            </div>

            {/* Enhanced Phone Input */}
            <EnhancedPhoneInput
              value={phone}
              onChange={setPhone}
              onPhoneCodeChange={setPhoneCode}
              phoneCode={phoneCode}
              disabled={isRequestingOTP}
              isLoading={isRequestingOTP}
              autoTriggerPasskey={autoTriggerPasskey}
              skipPasskeyCheck={skipPasskeyCheck}
              onPasskeyLogin={handlePasskeyLogin}
              checkPasskeyAvailability={checkPasskeyAvailability}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && phone.length === 10 && !isRequestingOTP) {
                  handlePhoneSubmit();
                }
              }}
            />

            {phoneError && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {phoneError}
              </div>
            )}

            <button
              onClick={handlePhoneSubmit}
              disabled={isRequestingOTP || phone.length !== 10}
              className="w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-lg text-sm sm:text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isRequestingOTP ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Send OTP
                </>
              )}
            </button>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-5 sm:space-y-6">
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
                    aria-label={`OTP digit ${index + 1}`}
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
                onClick={() => handleOTPSubmit()}
                disabled={isVerifyingOTP || otp.length !== 6}
                className="w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-xl shadow-lg text-sm sm:text-base font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
