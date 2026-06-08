import React, { useState } from 'react';
import { Lock, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface TransactionPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPinSet: boolean;
  onPinVerified: (pin: string) => void;
  onPinSetupComplete: (pin: string) => void;
  userPin: string;
  amount: number;
  description: string;
}

export const TransactionPinModal: React.FC<TransactionPinModalProps> = ({
  isOpen,
  onClose,
  isPinSet,
  onPinVerified,
  onPinSetupComplete,
  userPin,
  amount,
  description,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // For Pin Setup Mode
  const [setupStep, setSetupStep] = useState<1 | 2>(1); // 1: Enter PIN, 2: Confirm PIN
  const [firstPin, setFirstPin] = useState<string>('');

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numbers
    if (val !== '' && !/^[0-9]$/.test(val)) return;

    const newDigits = [...pinDigits];
    newDigits[index] = val;
    setPinDigits(newDigits);

    // Auto-focus next field
    if (val !== '' && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && pinDigits[index] === '' && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleClear = () => {
    setPinDigits(['', '', '', '']);
    setErrorMsg('');
    const firstInput = document.getElementById('pin-input-0');
    firstInput?.focus();
  };

  const handleSubmit = () => {
    const fullPin = pinDigits.join('');
    if (fullPin.length < 4) {
      setErrorMsg('Please enter all 4 digits.');
      return;
    }

    if (!isPinSet) {
      // Pin setting flow
      if (setupStep === 1) {
        setFirstPin(fullPin);
        setSetupStep(2);
        setPinDigits(['', '', '', '']);
        setErrorMsg('');
        setTimeout(() => document.getElementById('pin-input-0')?.focus(), 100);
      } else {
        if (fullPin !== firstPin) {
          setErrorMsg('PINs do not match. Please try again.');
          setPinDigits(['', '', '', '']);
          setSetupStep(1);
          setFirstPin('');
          setTimeout(() => document.getElementById('pin-input-0')?.focus(), 100);
        } else {
          onPinSetupComplete(fullPin);
          handleClear();
          setSetupStep(1);
          setFirstPin('');
        }
      }
    } else {
      // Normal validation flow
      if (fullPin === userPin || userPin === '') {
        onPinVerified(fullPin);
        handleClear();
      } else {
        setErrorMsg('Incorrect PIN. Please try again.');
        setPinDigits(['', '', '', '']);
        setTimeout(() => document.getElementById('pin-input-0')?.focus(), 100);
      }
    }
  };

  const handleMockPinAutoFill = () => {
    if (isPinSet) {
      const defaultPinArray = userPin ? userPin.split('') : ['1', '2', '3', '4'];
      setPinDigits(defaultPinArray);
      setErrorMsg('');
    } else {
      setPinDigits(['1', '1', '1', '1']);
      setErrorMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        id="pin-modal-card" 
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
        style={{ animation: 'bounceUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="font-display font-semibold">
              {!isPinSet 
                ? (setupStep === 1 ? 'Set Transaction PIN' : 'Confirm New PIN') 
                : 'Security Verification'}
            </span>
          </div>
          <button 
            id="close-pin-modal-btn" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {isPinSet ? (
            <div className="mb-4">
              <div className="inline-flex p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed">
                Enter your 4-digit PIN to authorize this transaction of
              </p>
              <p className="text-xl font-bold text-slate-800 font-display mt-1">
                ₦{amount.toLocaleString('en-NG')}
              </p>
              <p className="text-xs text-indigo-600 font-mono mt-1 font-medium bg-indigo-50 px-2 py-0.5 rounded-full inline-block max-w-xs truncate">
                {description}
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <div className="inline-flex p-3 bg-indigo-50 rounded-full text-indigo-600 mb-2">
                <Lock className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-500 font-medium max-w-xs">
                {setupStep === 1 
                  ? 'First time transaction? Create a 4-digit secret PIN to lock your wallet.' 
                  : 'Re-enter the 4-digit PIN to finalize and save.'}
              </p>
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-1 rounded-md max-w-xs inline-block">
                ⚠️ Don&apos;t forget this PIN. You will need it to make all purchases!
              </p>
            </div>
          )}

          {/* Secure 4 Digit Inputs */}
          <div className="flex justify-center gap-3 my-4">
            {pinDigits.map((digit, index) => (
              <input
                key={index}
                id={`pin-input-${index}`}
                type={showPin ? 'text' : 'password'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-200 outline-none rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-display shadow-inner"
              />
            ))}
          </div>

          {/* Error feedback */}
          {errorMsg && (
            <p className="text-xs font-semibold text-red-500 mb-2" id="pin-error-text">
              {errorMsg}
            </p>
          )}

          {/* Utilities */}
          <div className="w-full flex items-center justify-between text-xs mb-6 px-1">
            <button
              id="show-hide-pin-btn"
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium focus:outline-none"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPin ? 'Hide characters' : 'Show characters'}
            </button>

            <button
              id="autofill-pin-btn"
              type="button"
              onClick={handleMockPinAutoFill}
              className="text-indigo-600 font-semibold hover:text-indigo-800"
            >
              {isPinSet ? 'Auto-Fill Current PIN' : 'Set standard PIN (1111)'}
            </button>
          </div>

          {/* Buttons */}
          <div className="w-full flex gap-3">
            <button
              id="cancel-pin-btn"
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-pin-btn"
              type="button"
              onClick={handleSubmit}
              className="w-1/2 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-black transition-colors shadow-md hover:shadow-lg"
            >
              {isPinSet 
                ? 'Verify PIN' 
                : (setupStep === 1 ? 'Set PIN' : 'Confirm Save')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounceUp {
          from {
            transform: scale(0.9) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
