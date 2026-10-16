import React, { useState } from 'react';

export const AbdmView: React.FC = () => {
  const [isWaitlisted, setIsWaitlisted] = useState(false);

  const toggleWaitlist = () => {
    setIsWaitlisted(!isWaitlisted);
  };

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Status Chip Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
          <span className="material-symbols-outlined text-[15px] text-teal-600">verified</span>
          <span className="uppercase tracking-wider text-[10px]">National Health Authority</span>
        </div>
        <div className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span>Sandbox Pilot</span>
        </div>
      </div>

      {/* Hero Showcase Card */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[26px]">assured_workload</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                ABDM • HIU Module
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                Planned Feature
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              Fetch your nationwide health records
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-600 relative z-10 leading-relaxed">
          Connect your Ayushman Bharat Health Account (ABHA) address to securely aggregate clinical records, diagnostic tests, and hospital discharge summaries across registered Indian medical institutions.
        </p>

        {/* Milestone Progress Bar */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-2 relative z-10 border border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-800">
            <span className="font-bold flex items-center gap-1 text-teal-700">
              <span className="material-symbols-outlined text-[15px]">construction</span>
              Sandbox Compliance Status
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Milestone 2 of 3</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
            <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: '66%' }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span className="text-teal-700 font-semibold">✓ M1 ABHA ID</span>
            <span className="text-teal-700 font-semibold">✓ M2 Consent</span>
            <span className="opacity-70">• M3 Data Fetch</span>
          </div>
        </div>
      </div>

      {/* Interactive Waitlist Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[20px]">mark_email_read</span>
            <h2 className="text-sm font-bold text-slate-900">Get Early Access</h2>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Coming Q2 2026
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Experience frictionless, end-to-end encrypted imports when our ABDM HIU bridge completes certifiable sandbox auditing.
        </p>

        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Your ABHA Address / Mobile Number</span>
            <span className="text-teal-700 font-medium">Read-only preview</span>
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 space-x-2">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
            <input
              type="text"
              readOnly
              disabled
              value="patient@sbx"
              className="bg-transparent text-slate-600 text-xs font-mono w-full outline-none select-none cursor-not-allowed"
            />
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
              ABHA
            </span>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={toggleWaitlist}
            className={`w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
              isWaitlisted
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isWaitlisted ? 'check_circle' : 'notification_add'}
            </span>
            <span>{isWaitlisted ? 'Waitlist Joined' : 'Join ABDM Early Access Waitlist'}</span>
          </button>
          {isWaitlisted && (
            <p className="text-xs text-emerald-700 text-center mt-2 font-medium">
              You're on the list! We'll alert you the moment your ABHA records are ready to link.
            </p>
          )}
        </div>
      </div>

      {/* Planned Core Capabilities */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-teal-600">hub</span>
          Planned Core Capabilities
        </h3>

        <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-slate-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">encrypted</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900">Consent Manager Protocol</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              You retain complete granular control. Every document retrieval requires your explicit OTP authentication before transfer.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-slate-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">local_hospital</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900">Participating Hospital Aggregation</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Auto-fetch past prescriptions, diagnostic pathology reports, and discharge summaries from empaneled ABDM hospitals.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-2xs border border-slate-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900">FHIR Normalized Records</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Incoming medical data is transformed into structured, AI-readable longitudinal summaries on your Take Care timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Supported FHIR Bundles */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Supported FHIR Bundles</span>
          <span className="text-[11px] text-slate-500 font-medium">5 Categories</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Prescriptions', 'Lab Reports', 'Discharge Summaries', 'Immunizations', 'Diagnostic Imaging'].map((bundle) => (
            <div
              key={bundle}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px] text-teal-600">check_small</span>
              <span>{bundle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-white rounded-xl p-3 text-center border border-slate-200 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <span className="material-symbols-outlined text-[16px] text-teal-600">policy</span>
          <span>ABDM HIU Sandbox ID: TC-HIU-SBX-0982</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Records are secured via end-to-end ECDH Diffie-Hellman encryption.
        </p>
      </div>
    </div>
  );
};
