import React, { useState } from 'react';
import { MessageSquare, KeyRound, AlertCircle, Check, Loader2 } from 'lucide-react';
import { ApiService } from '../../services/api';
import { AuthUser, UserProfile } from '../../types/clinical';

interface VerifyViewProps {
  mobile: string;
  initialDevCode?: string;
  onVerifySuccess: (user: AuthUser, profile: UserProfile) => void;
  onBackToSignup: () => void;
}

export const VerifyView: React.FC<VerifyViewProps> = ({
  mobile,
  initialDevCode = '',
  onVerifySuccess,
  onBackToSignup,
}) => {
  const [code, setCode] = useState(initialDevCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || code.trim().length < 4) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await ApiService.verify(mobile, code.trim());
      onVerifySuccess(data.user, data.profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col w-full max-w-md mx-auto px-4 py-8 animate-fadeIn"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#006D60] border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verify Mobile Number</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          We sent a verification code to <strong className="text-slate-800 font-mono">+91 {mobile}</strong>
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Transparent Local Development Notice */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <KeyRound className="w-4 h-4 text-amber-700" />
            <span>Local Development Authentication</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Real SMS gateway is unconfigured in this local sandbox environment. Your verification code is generated below for testing:
          </p>
          <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-300">
            <span className="font-mono font-black text-base tracking-widest text-[#006D60]">
              {initialDevCode || '123456'}
            </span>
            <button
              type="button"
              onClick={() => setCode(initialDevCode || '123456')}
              className="text-[11px] font-bold text-[#006D60] hover:underline cursor-pointer"
            >
              Autofill Code
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 123456"
              className="w-full h-13 px-4 text-center font-mono text-2xl tracking-widest font-black bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#006D60] focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !code}
            className="w-full h-12 bg-[#006D60] hover:bg-[#005a4e] active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Account...</span>
              </>
            ) : (
              <>
                <span>Verify &amp; Continue</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Entered the wrong number?{' '}
          <button
            type="button"
            onClick={onBackToSignup}
            className="font-bold text-[#006D60] hover:underline cursor-pointer"
          >
            Change Number
          </button>
        </div>
      </div>
    </div>
  );
};
