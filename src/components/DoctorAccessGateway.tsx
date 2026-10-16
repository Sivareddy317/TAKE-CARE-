import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Key, Clock, AlertCircle, Loader2, CheckCircle2, Info, Lock } from 'lucide-react';
import { ApiService } from '../services/api';

interface DoctorAccessGatewayProps {
  initialCode?: string;
  onAccessGranted: (code: string, authToken: string) => void;
  onReturnToPatientView: () => void;
}

export const DoctorAccessGateway: React.FC<DoctorAccessGatewayProps> = ({
  initialCode = '',
  onAccessGranted,
  onReturnToPatientView,
}) => {
  // Start with empty digits - no pre-filled fake or premature code
  const [digits, setDigits] = useState<string[]>(() => {
    if (initialCode && initialCode.length === 6 && /^\d{6}$/.test(initialCode)) {
      return initialCode.split('');
    }
    return ['', '', '', '', '', ''];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ text: string; type: 'error' | 'expired' | 'rate' } | null>(null);
  const [activeSessionHint, setActiveSessionHint] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if an active session exists on the backend to assist testing
  useEffect(() => {
    async function checkActiveSession() {
      try {
        const res = await fetch(ApiService.url('/api/share/active-session'));
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          if (data.active && data.session?.code) {
            setActiveSessionHint(data.session.code);
          }
        }
      } catch {
        // Backend offline or unreachable
      }
    }
    checkActiveSession();
  }, []);

  const handleInputChange = (index: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return;

    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance to next input box
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      const newDigits = [...digits];
      paste.split('').forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      setErrorMessage(null);
      const nextIndex = Math.min(paste.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const pasteCode = (code: string) => {
    const chars = code.split('').slice(0, 6);
    setDigits(chars);
    setErrorMessage(null);
    inputRefs.current[5]?.focus();
  };

  // Perform genuine server-side verification
  const verifyCode = async (codeToVerify?: string) => {
    const fullCode = (codeToVerify || digits.join('')).trim();
    if (fullCode.length < 6) {
      setErrorMessage({
        text: 'Please enter all 6 digits of the patient access code.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(ApiService.url('/api/doctor/verify-access'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });

      const cType = res.headers.get('content-type') || '';
      const data = cType.includes('application/json') ? await res.json().catch(() => ({})) : {};

      if (!res.ok) {
        if (res.status === 429 || data.status === 'rate_limited') {
          setErrorMessage({
            text: `<strong>Rate-Limiting Active:</strong> ${data.error || 'Too many failed attempts. Try again in 15 minutes.'}`,
            type: 'rate',
          });
        } else if (res.status === 403 && data.status === 'expired') {
          setErrorMessage({
            text: `<strong>Access Window Expired:</strong> ${data.error || 'This code has exceeded its authorized window.'}`,
            type: 'expired',
          });
        } else if (res.status === 403 && data.status === 'revoked') {
          setErrorMessage({
            text: `<strong>Access Revoked:</strong> ${data.error || 'The patient has explicitly revoked access to this sharing token.'}`,
            type: 'error',
          });
        } else {
          setErrorMessage({
            text: `<strong>Verification Failed:</strong> ${data.error || 'Invalid access code. Please check with your patient.'}`,
            type: 'error',
          });
        }
        return;
      }

      if (data.success && data.authToken) {
        onAccessGranted(data.sessionCode || fullCode, data.authToken);
      } else {
        throw new Error('Server returned invalid session token.');
      }
    } catch (err: any) {
      setErrorMessage({
        text: `<strong>Connection Error:</strong> ${err.message || 'Unable to connect to hospital gateway backend. Check network.'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Title & Trust Header matching Take Care style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            View Patient Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter the 6-digit access code provided by your patient.
          </p>
        </div>
        <div className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] text-teal-800 font-semibold">Doctor Access</span>
        </div>
      </div>

      {/* Clinician Notice Banner */}
      <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs text-teal-950">
        <ShieldCheck className="w-5 h-5 text-[#006D60] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Patient-Governed Access:</strong> Clinicians do not sign in as patients. Medical records are unlocked strictly through ephemeral 6-digit tokens validated in real time against the backend.
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="text-center pb-2">
          <div className="w-12 h-12 bg-teal-50 text-[#006D60] rounded-2xl flex items-center justify-center mx-auto mb-2.5 border border-teal-200 shadow-2xs">
            <Key className="w-6 h-6 text-[#006D60]" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Enter 6-Digit Access Code
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The code is valid for 15m, 1h, or 24h as authorized by the patient.
          </p>
        </div>

        {/* 6-Digit Input Boxes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Patient Access Code
            </label>
            {activeSessionHint && (
              <button
                type="button"
                onClick={() => pasteCode(activeSessionHint)}
                className="text-[11px] text-[#006D60] hover:text-teal-800 font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <span>Autofill Active Code ({activeSessionHint})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 transition focus:outline-none focus:border-[#006D60] focus:bg-white shadow-2xs"
              />
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Auto-advances between inputs. Paste supported.</span>
            <span className="font-mono text-[10px] text-slate-500">Security Rate-Limited</span>
          </p>
        </div>

        {/* Error / Feedback Message */}
        {errorMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed animate-fadeIn ${
              errorMessage.type === 'expired'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {errorMessage.type === 'expired' ? (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div
              className="flex-1 font-medium"
              dangerouslySetInnerHTML={{ __html: errorMessage.text }}
            />
          </div>
        )}

        {/* Primary Action Button: "Verify & View Summary" (MANDATORY LABEL) */}
        <div>
          <button
            type="button"
            disabled={isLoading || digits.join('').length < 6}
            onClick={() => verifyCode()}
            className="w-full h-12 bg-[#006D60] hover:bg-[#005a4e] active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validating with Hospital Gateway...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Verify &amp; View Summary</span>
              </>
            )}
          </button>
        </div>

        {/* Clinical Testing Walkthrough Tip */}
        <div className="pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#006D60]" />
                How to Test Doctor Verification
              </span>
              <span className="text-[10px] font-bold bg-teal-50 text-[#006D60] border border-teal-200 px-2 py-0.5 rounded-full">
                Interactive Test
              </span>
            </div>
            <p className="leading-relaxed text-[11px]">
              1. Open the <strong>Share</strong> tab in the Take Care app.
            </p>
            <p className="leading-relaxed text-[11px]">
              2. Click <strong>Generate Doctor Access Code</strong> to produce a live 6-digit server token.
            </p>
            <p className="leading-relaxed text-[11px]">
              3. Enter that code here and click <strong>Verify &amp; View Summary</strong> to access the clinical view.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={onReturnToPatientView}
                className="text-xs text-[#006D60] hover:underline font-semibold"
              >
                ← Return to Patient View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Audit Footer */}
      <div className="text-center space-y-1 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-[11px] font-medium">
          <Lock className="w-3.5 h-3.5 text-[#006D60]" />
          <span>Zero-Knowledge Consultation Token Protocol</span>
        </div>
        <p className="text-[11px] text-slate-400 px-4 leading-relaxed">
          HIPAA &amp; ABDM-compliant ephemeral exchange. No patient credentials or passwords required.
        </p>
      </div>
    </div>
  );
};
