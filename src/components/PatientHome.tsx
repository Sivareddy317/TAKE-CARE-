import React from 'react';
import { ProcessedDocument, UserProfile } from '../types/clinical';

interface PatientHomeProps {
  profile: UserProfile;
  documents: ProcessedDocument[];
  isDemoMode: boolean;
  onNavigate: (tab: string) => void;
  onSelectDocument: (doc: ProcessedDocument) => void;
  onEnableDemoMode: () => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  profile,
  documents,
  isDemoMode,
  onNavigate,
  onSelectDocument,
  onEnableDemoMode,
}) => {
  const confirmedDocs = documents.filter(
    (d) => d.status === 'Confirmed' || d.extractedEntities.some((e) => e.status === 'Confirmed')
  );

  // Derive real statistics from confirmed entities strictly
  const totalAllergies = documents.flatMap((d) =>
    d.extractedEntities.filter((e) => e.category === 'allergy' && e.status !== 'Rejected')
  ).length;

  const totalMeds = documents.flatMap((d) =>
    d.extractedEntities.filter((e) => e.category === 'medication' && e.status !== 'Rejected')
  ).length;

  const hasSummary = confirmedDocs.length > 0;

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Greeting & Subtitle */}
      <section className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
          <span>{profile.fullName ? `Hello, ${profile.fullName}` : 'Welcome to Take Care'}</span>
          <span className="inline-block transform hover:rotate-12 transition-transform select-none">
            👋
          </span>
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your personal health records, organised and ready when you need them.
        </p>
      </section>

      {/* Complete Profile Prompt (Shown only if profile is incomplete) */}
      {!profile.isComplete && (
        <section>
          <div
            onClick={() => onNavigate('profile-edit')}
            className="p-3.5 rounded-2xl bg-teal-50/90 border border-teal-200 flex items-center justify-between hover:bg-teal-100/70 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[20px]">person_outline</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-teal-950">Complete Your Patient Profile</h4>
                <p className="text-[11px] text-teal-800/80 mt-0.5">
                  Add date of birth and emergency contacts to complete your record.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-teal-700 text-[18px]">chevron_right</span>
          </div>
        </section>
      )}

      {/* Health Summary Highlight Feature Card (Dynamic state for fresh vs populated account) */}
      <section>
        {hasSummary ? (
          <div
            onClick={() => onNavigate('summary')}
            className="cursor-pointer block group relative overflow-hidden bg-gradient-to-br from-teal-700 to-teal-900 text-white p-5 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 text-white backdrop-blur-sm shadow-inner">
                  <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">Your Health Summary</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-teal-950 text-[10px] font-extrabold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-teal-100 mt-0.5">
                    Generated from {confirmedDocs.length} confirmed document{confirmedDocs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white group-hover:translate-x-1 transition-transform">
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </div>
            </div>

            {/* Real Snapshot Metrics (Responsive flex-wrap without horizontal scrollbars) */}
            <div className="relative z-10 mt-4 pt-3 border-t border-teal-600/50 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-white text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px] text-teal-300">healing</span>
                <span>{totalAllergies} Allerg{totalAllergies === 1 ? 'y' : 'ies'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-white text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px] text-teal-300">medication</span>
                <span>{totalMeds} Medication{totalMeds !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-white text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px] text-teal-300">bloodtype</span>
                <span>{profile.bloodGroup || 'Blood Group: Unrecorded'}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State for Fresh Account */
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Your Health Summary</h2>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Not Generated Yet
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No summary generated yet. Upload and review medical documents to create your health summary.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">0 records indexed</span>
              <button
                type="button"
                onClick={() => onNavigate('upload')}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                <span>Upload First Document</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Clinician Entry: View Patient Summary (Doctor Access) */}
      <section>
        <button
          type="button"
          onClick={() => onNavigate('doctor-access')}
          className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/90 to-slate-50 border border-teal-200 shadow-2xs hover:shadow-sm hover:border-teal-400 transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">stethoscope</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                  View Patient Summary
                </span>
                <span className="px-2 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  Doctor Access
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Clinician access: Enter 6-digit access code to view consultation summary
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-teal-700 text-[18px] group-hover:translate-x-1 transition-transform flex-shrink-0">
            arrow_forward
          </span>
        </button>
      </section>

      {/* Dashboard Metrics (Computed strictly from real authenticated records) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Documents Uploaded</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{documents.length}</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Processed</p>
          <p className="text-lg font-black text-teal-700 mt-0.5">
            {documents.filter((d) => d.status === 'Confirmed' || d.extractedEntities.length > 0).length}
          </p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Awaiting Review</p>
          <p className="text-lg font-black text-amber-600 mt-0.5">
            {documents.flatMap((d) => d.extractedEntities).filter((e) => e.status === 'Extracted').length}
          </p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Confirmed Findings</p>
          <p className="text-lg font-black text-emerald-700 mt-0.5">
            {documents.flatMap((d) => d.extractedEntities).filter((e) => e.status === 'Confirmed' || e.status === 'Edited').length}
          </p>
        </div>
      </section>

      {/* 4 Quick Actions Grid */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Quick Actions
          </h3>
          <span className="text-xs text-slate-500 font-medium">Instant Shortcuts</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 1. Upload Documents */}
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="text-left p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between h-[118px] group active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">north_east</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Upload Documents
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">PDF, JPG or PNG</span>
            </div>
          </button>

          {/* 2. View Summary */}
          <button
            type="button"
            onClick={() => onNavigate('summary')}
            className="text-left p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between h-[118px] group active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">description</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">north_east</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                View Summary
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {hasSummary ? 'Consolidated cards' : '0 records reviewed'}
              </span>
            </div>
          </button>

          {/* 3. Share with Doctor */}
          <button
            type="button"
            onClick={() => onNavigate('share')}
            className="text-left p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between h-[118px] group active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">share</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[16px]">north_east</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                Share with Doctor
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {hasSummary ? 'Generate 6-digit code' : 'Requires reviewed summary'}
              </span>
            </div>
          </button>

          {/* 4. ABDM Records */}
          <button
            type="button"
            onClick={() => onNavigate('abdm')}
            className="text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs hover:border-teal-300 transition-all flex flex-col justify-between h-[118px] group active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <span className="px-2 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[9px] font-bold">
                Soon
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                ABDM / HIU
              </span>
              <span className="text-[11px] text-teal-700 font-medium mt-0.5 block">Coming Soon</span>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Documents Feed (Clear Empty State for Fresh Accounts) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              My Documents ({documents.length})
            </h3>
            {documents.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            )}
          </div>
          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          /* Empty State (MANDATORY REQUIREMENT 4) */
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[26px]">folder_open</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">No medical documents yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Upload a prescription, lab report or discharge summary to get started.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Upload Document</span>
            </button>
          </div>
        ) : (
          /* List of Real Documents */
          <div className="space-y-2">
            {documents.slice(0, 3).map((doc) => {
              const isPdf = doc.fileType === 'pdf';
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className="group cursor-pointer flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isPdf
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-sky-50 text-sky-600 border border-sky-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isPdf ? 'picture_as_pdf' : 'image'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition">
                        {doc.filename}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                        <span>{doc.uploadDate}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-teal-700 font-semibold">{doc.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {doc.ocrConfidence}% OCR
                    </span>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-700 text-[18px]">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
