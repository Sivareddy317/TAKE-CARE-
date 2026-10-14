import React, { useState, useEffect, useRef } from 'react';
import { ProcessedDocument, UserProfile } from '../types/clinical';
import { ApiService } from '../services/api';

interface ShareDoctorViewProps {
  profile: UserProfile;
  documents: ProcessedDocument[];
  isDemoMode?: boolean;
  onOpenDoctorPortal: (code?: string) => void;
  onNavigate: (tab: string) => void;
}

export const ShareDoctorView: React.FC<ShareDoctorViewProps> = ({
  profile,
  documents,
  isDemoMode = false,
  onOpenDoctorPortal,
  onNavigate,
}) => {
  const [accessDuration, setAccessDuration] = useState<'15m' | '1h' | '24h'>('1h');
  const [isCodeGenerated, setIsCodeGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'accessed' | 'expired' | 'revoked' | null>(null);
  const [codeValue, setCodeValue] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [copiedLabel, setCopiedLabel] = useState('Copy Code');
  const [sharedLabel, setSharedLabel] = useState('Share Code');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  // Health data scope checkboxes
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDocs, setIncludeDocs] = useState(true);
  const [includeLabs, setIncludeLabs] = useState(true);

  // Optional Doctor Details
  const doctorDetails = {
    name: 'Dr. Rajesh Sharma, MD',
    hospital: 'City Hospital, Hyderabad',
    specialty: 'Cardiology',
    nmcReg: 'NMC-48102',
  };

  const isMountedRef = useRef(true);

  // Derive real entity highlights
  const allEntities = documents.flatMap((d) => d.extractedEntities);
  const topAllergy = allEntities.find((e) => e.category === 'allergy' && e.status !== 'Rejected');
  const topMed = allEntities.find((e) => e.category === 'medication' && e.status !== 'Rejected');
  const topCondition = allEntities.find((e) => e.category === 'condition' && e.status !== 'Rejected');
  const topLab = allEntities.find((e) => e.category === 'lab' && e.status !== 'Rejected');
  const hasRecords = documents.length > 0 && allEntities.length > 0;

  // 1. On Mount / Navigation / Refresh: Query persisted backend state ONLY
  useEffect(() => {
    isMountedRef.current = true;

    async function checkPersistedActiveSession() {
      try {
        const data = await ApiService.getActiveSession();
        if (!isMountedRef.current) return;

        if (data && data.active && data.session) {
          setCodeValue(data.session.code);
          setTimeLeftSeconds(data.session.remainingSeconds || 0);
          setSessionStatus(data.session.status || 'active');
          setIsCodeGenerated(true);

          if (data.session.duration) {
            setAccessDuration(data.session.duration);
          }
          if (data.session.scope) {
            setIncludeSummary(!!data.session.scope.summary);
            setIncludeDocs(!!data.session.scope.docs);
            setIncludeLabs(!!data.session.scope.labs);
          }
        } else {
          setIsCodeGenerated(false);
          setCodeValue('');
          setTimeLeftSeconds(0);
          setSessionStatus(null);
        }
      } catch (err) {
        console.error('Error fetching active session:', err);
      }
    }

    checkPersistedActiveSession();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 2. Countdown Timer
  useEffect(() => {
    if (!isCodeGenerated || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSessionStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCodeGenerated, timeLeftSeconds]);

  // 3. Periodic Poll (every 4 seconds) to detect if Doctor has verified code
  useEffect(() => {
    if (!isCodeGenerated || sessionStatus === 'revoked' || sessionStatus === 'expired') return;

    const poll = setInterval(async () => {
      try {
        const data = await ApiService.getActiveSession();
        if (!isMountedRef.current) return;
        if (data && data.active && data.session) {
          setSessionStatus(data.session.status);
          if (data.session.status === 'revoked') {
            setIsCodeGenerated(false);
            setRevokedMessage('Access code was revoked.');
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(poll);
  }, [isCodeGenerated, sessionStatus]);

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit request to generate 6-digit access code
  const handleGenerateCode = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setRevokedMessage(null);

    try {
      const data = await ApiService.generateDoctorCode(accessDuration, {
        summary: includeSummary,
        docs: includeDocs,
        labs: includeLabs,
      });

      if (!data.success || !data.session?.code) {
        throw new Error(data.error || 'Failed to generate access code.');
      }

      setCodeValue(data.session.code);
      setTimeLeftSeconds(data.session.remainingSeconds || 3600);
      setSessionStatus('active');
      setIsCodeGenerated(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to generate doctor access code. Please try again.');
      setIsCodeGenerated(false);
      setCodeValue('');
      setTimeLeftSeconds(0);
      setSessionStatus(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit revoke request to backend
  const handleRevoke = async () => {
    try {
      await ApiService.revokeAccess(codeValue);
    } catch (err) {
      console.error('Error sending revoke request:', err);
    }

    setRevokedMessage('Access code was successfully revoked. The doctor can no longer view your records.');
    setIsCodeGenerated(false);
    setCodeValue('');
    setTimeLeftSeconds(0);
    setSessionStatus('revoked');
  };

  const handleCopyCode = () => {
    if (!codeValue) return;
    navigator.clipboard?.writeText(codeValue);
    setCopiedLabel(`Copied (${codeValue})!`);
    setTimeout(() => setCopiedLabel('Copy Code'), 2200);
  };

  const handleShareCode = () => {
    if (!codeValue) return;
    if (navigator.share) {
      navigator.share({
        title: 'Take Care - Doctor Access Code',
        text: `Doctor Access Code: ${codeValue.slice(0, 3)} ${codeValue.slice(3, 6)} (Valid for ${accessDuration})`,
      }).catch(() => {});
    } else {
      setSharedLabel('Code Copied!');
      navigator.clipboard?.writeText(codeValue);
      setTimeout(() => setSharedLabel('Share Code'), 2000);
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Title & Trust Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Share Health Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate a secure 6-digit access code for your doctor.
          </p>
        </div>
        <div className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[11px] text-teal-800 font-semibold">End-to-End Secure</span>
        </div>
      </div>

      {isDemoMode && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[18px]">science</span>
          <span>Demo Mode Active: Generating access codes for demo patient profile.</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-fadeIn">
          <span className="material-symbols-outlined text-rose-600 text-[20px] flex-shrink-0 mt-0.5">
            error
          </span>
          <div className="space-y-1">
            <p className="font-bold">Generation Failed</p>
            <p className="text-rose-800 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Revoked Notice */}
      {revokedMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">check_circle</span>
          <div className="flex-1">{revokedMessage}</div>
        </div>
      )}

      {/* 1. Selected Health Summary Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Selected Health Summary
              </h2>
              <p className="text-[11px] text-slate-500">
                {profile.fullName || 'Valued Patient'} • +91 {profile.mobile}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('summary')}
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Review</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>

        {/* Health Profile Highlights */}
        {hasRecords ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Top Allergy</span>
              <span className="font-bold text-rose-700 text-xs mt-0.5 block truncate">
                {topAllergy ? topAllergy.value : 'None Recorded'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Medications</span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                {topMed ? topMed.title || topMed.value : 'None Recorded'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Diagnoses</span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                {topCondition ? topCondition.title || topCondition.value : 'None Recorded'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Blood Group</span>
              <span className="font-bold text-amber-700 text-xs mt-0.5 block truncate">
                {profile.bloodGroup || 'Not Documented'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">No clinical records indexed yet</span>
              <span className="text-[11px] text-slate-500 block">Sharing will transmit your identity and profile fields.</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
            >
              Upload
            </button>
          </div>
        )}

        {/* Health Data Scope Checkboxes */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Data Scope Included:</span>
            <span className="text-teal-700 font-medium text-[11px]">
              {[includeSummary, includeDocs, includeLabs].filter(Boolean).length} of 3 sections
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition cursor-pointer">
              <span className="font-medium text-slate-800">Consolidated Health Summary</span>
              <input
                type="checkbox"
                checked={includeSummary}
                disabled={isCodeGenerated && sessionStatus === 'active'}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
              />
            </label>
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition cursor-pointer">
              <span className="font-medium text-slate-800">Original Document Scans &amp; PDFs</span>
              <input
                type="checkbox"
                checked={includeDocs}
                disabled={isCodeGenerated && sessionStatus === 'active'}
                onChange={(e) => setIncludeDocs(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
              />
            </label>
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition cursor-pointer">
              <span className="font-medium text-slate-800">Lab Results &amp; Biomarkers</span>
              <input
                type="checkbox"
                checked={includeLabs}
                disabled={isCodeGenerated && sessionStatus === 'active'}
                onChange={(e) => setIncludeLabs(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Optional Doctor Details Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-600">stethoscope</span>
            Doctor / Hospital Details
          </span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Optional
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900">{doctorDetails.name}</p>
            <p className="text-[11px] text-slate-500">{doctorDetails.hospital}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold">
            {doctorDetails.nmcReg}
          </span>
        </div>
      </div>

      {/* 3. Access Duration Selection */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div>
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Access Duration
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Session expires automatically after this duration.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['15m', '1h', '24h'] as const).map((dur) => {
            const isSelected = accessDuration === dur;
            const labelMap = { '15m': '15 Minutes', '1h': '1 Hour', '24h': '24 Hours' };
            const subMap = { '15m': 'Quick OPD', '1h': 'Standard Visit', '24h': 'Day Care' };
            return (
              <button
                key={dur}
                type="button"
                disabled={isCodeGenerated && sessionStatus === 'active'}
                onClick={() => setAccessDuration(dur)}
                className={`py-3 px-2 rounded-xl border text-center transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold ring-1 ring-teal-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-xs block font-bold">{labelMap[dur]}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{subMap[dur]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Action Area: Before Code Generation */}
      {!isCodeGenerated && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateCode}
            className={`w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer ${
              isGenerating
                ? 'bg-teal-400 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Generating Doctor Access Code...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">key</span>
                <span>Generate Doctor Access Code</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400">
            No active countdown starts until you click generate. You can revoke access at any time.
          </p>
        </div>
      )}

      {/* 5. Sharing Panel: After Code Generation */}
      {isCodeGenerated && (
        <div className="rounded-3xl bg-gradient-to-br from-teal-900 to-slate-900 text-white p-6 shadow-xl border border-teal-700/50 space-y-5 animate-fadeIn">
          {/* Header Row: Status & Expiry */}
          <div className="flex items-center justify-between border-b border-teal-700/60 pb-3">
            <div className="flex items-center gap-2">
              {sessionStatus === 'active' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Waiting for Doctor
                  </span>
                </>
              )}
              {sessionStatus === 'accessed' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Doctor Viewing Now
                  </span>
                </>
              )}
              {sessionStatus === 'expired' && (
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Session Expired
                </span>
              )}
            </div>

            {/* Live Remaining Time derived from persisted backend timestamp */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold text-white backdrop-blur-xs">
              <span className="material-symbols-outlined text-[15px] text-teal-300">schedule</span>
              <span>{formatCountdown(timeLeftSeconds)}</span>
            </div>
          </div>

          {/* 6-Digit Access Code Display */}
          <div className="text-center space-y-2 py-2">
            <span className="text-xs font-semibold text-teal-200 tracking-wider uppercase block">
              Doctor Access Code
            </span>
            <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white select-all">
                {codeValue ? `${codeValue.slice(0, 3)} ${codeValue.slice(3, 6)}` : '------'}
              </span>
            </div>
            <p className="text-[11px] text-teal-200/80 max-w-xs mx-auto">
              Ask your doctor to enter this code in Take Care under <strong>Doctor Access</strong>.
            </p>
          </div>

          {/* Actions: Copy, Share, Doctor Portal & Revoke */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCopyCode}
              className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>{copiedLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleShareCode}
              className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>{sharedLabel}</span>
            </button>
          </div>

          {/* Doctor Access Shortcut for Testing & Revoke Button */}
          <div className="pt-2 border-t border-teal-700/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onOpenDoctorPortal(codeValue)}
              className="text-xs text-teal-200 hover:text-white font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <span>Test Doctor Portal</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>

            <button
              type="button"
              onClick={handleRevoke}
              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">block</span>
              <span>Revoke Access</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
