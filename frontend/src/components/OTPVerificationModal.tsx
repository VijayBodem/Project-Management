import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  title: string;
  description: string;
  email?: string;
  isLoading?: boolean;
  error?: string;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  title,
  description,
  email,
  isLoading = false,
  error
}) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setTimeLeft(600);
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    // Update OTP
    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pasteData.length === 6) {
      setOtp(pasteData);
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6 && !isLoading) {
      await onVerify(otp);
    }
  };

  const handleResend = () => {
    // This would trigger a resend OTP request
    // For now, just reset the timer
    setTimeLeft(600);
  };

  if (!isOpen) return null;

  const isExpired = timeLeft <= 0;
  const canSubmit = otp.length === 6 && !isExpired && !isLoading;

  return (
    <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-secondary-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-secondary-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <p className="text-secondary-600 mb-4">{description}</p>
            {email && (
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">{email}</span>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {isExpired ? (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Code expired</span>
              </div>
            ) : (
              <div className="text-secondary-600">
                <span className="text-sm">Code expires in </span>
                <span className="font-mono font-semibold text-blue-600">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* OTP Input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  value={otp[index] || ''}
                  onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-secondary-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  maxLength={1}
                  disabled={isLoading || isExpired}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verify Code
                </>
              )}
            </button>
          </form>

          {/* Resend Option */}
          <div className="text-center">
            <p className="text-sm text-secondary-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={timeLeft > 570 || isLoading} // Allow resend after 30 seconds
              className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-secondary-400 disabled:cursor-not-allowed transition-colors"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
