import React, { useState } from 'react';
import { ProcessedDocument, UserProfile } from '../types/clinical';
import { AyuHealthLogo } from './common/AppLogo';

interface AyuHomeProps {
  profile?: UserProfile | null;
  documents: ProcessedDocument[];
  onNavigate: (tab: string) => void;
  onSelectDocument: (doc: ProcessedDocument) => void;
  onOpenAskAyuWithQuery?: (initialQuery: string) => void;
}

export const AyuHome: React.FC<AyuHomeProps> = ({
  profile,
  documents,
  onNavigate,
  onSelectDocument,
  onOpenAskAyuWithQuery,
}) => {
  const [askQuery, setAskQuery] = useState('');
  const [isHealthTipModalOpen, setIsHealthTipModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const firstName = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : 'Siva';

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenAskAyuWithQuery) {
      onOpenAskAyuWithQuery(askQuery);
    } else {
      onNavigate('ask-ayu');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none">
      <div className="space-y-6">
        {/* Top Bar (Matching Image 4 & 7) */}
        <div className="flex items-center justify-between pt-1">
          <AyuHealthLogo size="md" />

          <div className="flex items-center gap-2 relative">
            {/* User Pill: Siva ⌵ */}
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="px-3 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <span>{firstName}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {/* Profile Avatar Button */}
            <button
              type="button"
              onClick={() => onNavigate('account')}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition cursor-pointer"
              title="Account settings"
            >
              <span className="material-symbols-outlined text-[18px]">person_outline</span>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-11 z-30 bg-white rounded-2xl shadow-lg border border-slate-200 p-2 w-48 space-y-1 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('account');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                  <span>My Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('profile-edit');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('doctor-access');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-teal-800 hover:bg-teal-50 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                  <span>Doctor Access</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Greeting Section (Matching Image 4) */}
        <div className="space-y-1 pt-2">
          <p className="text-sm font-medium text-slate-700">Hello {firstName},</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Where should we <br /> start?
          </h1>
        </div>

        {/* Feature Action Buttons List (Matching Image 4) */}
        <div className="space-y-3 pt-1">
          {/* 1. Scan medical documents */}
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              crop_free
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Scan medical documents
            </span>
            {documents.length > 0 && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {documents.length} added
              </span>
            )}
          </button>

          {/* 2. My medical history */}
          <button
            type="button"
            onClick={() => onNavigate('documents')}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              schedule
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              My medical history
            </span>
            <span className="ml-auto text-xs text-slate-400 font-semibold">
              {documents.length > 0 ? `${documents.length} files` : '0 files'}
            </span>
          </button>

          {/* 3. Set medicine reminders */}
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              notifications_none
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Set medicine reminders
            </span>
          </button>

          {/* 4. Book appointment */}
          <button
            type="button"
            onClick={() => onNavigate('appointments')}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              calendar_month
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Book appointment
            </span>
          </button>

          {/* 5. Track my diabetes */}
          <button
            type="button"
            onClick={() => onNavigate('diabetes')}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              trending_up
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Track my diabetes
            </span>
          </button>

          {/* 6. Strengthening immunity for flu seas... (Health Tip Pill from Image 4) */}
          <button
            type="button"
            onClick={() => setIsHealthTipModalOpen(true)}
            className="w-full py-3.5 px-5 bg-[#FFEFEA] hover:bg-[#FFE6E0] border border-[#FFDDD6] rounded-full shadow-2xs flex items-center gap-3 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="text-sm">💬</span>
            <span className="text-xs sm:text-sm font-bold text-[#C2410C] truncate">
              Strengthening immunity for flu seas...
            </span>
            <span className="ml-auto text-xs text-[#C2410C] font-semibold">✨</span>
          </button>
        </div>
      </div>

      {/* Bottom Capsule Query Bar: Ask me anything! (Matching Image 4) */}
      <div className="pt-6 pb-2">
        <form
          onSubmit={handleAskSubmit}
          className="flex items-center gap-2"
        >
          {/* Input capsule */}
          <div
            onClick={() => onNavigate('ask-ayu')}
            className="flex-1 flex items-center bg-[#EFF1F4] hover:bg-white rounded-full px-5 py-3 border border-transparent hover:border-slate-300 transition cursor-pointer shadow-2xs"
          >
            <input
              type="text"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="Ask me anything!"
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none cursor-pointer"
            />
          </div>

          {/* Plus (+) Button to launch Scan */}
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="w-11 h-11 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-800 transition flex-shrink-0 cursor-pointer shadow-2xs"
            title="Scan or upload medical document"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          {/* Microphone button */}
          <button
            type="button"
            onClick={() => onNavigate('ask-ayu')}
            className="w-11 h-11 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-800 transition flex-shrink-0 cursor-pointer shadow-2xs"
            title="Voice query"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
        </form>
      </div>

      {/* Seasonal Immunity Health Tip Modal */}
      {isHealthTipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-base font-bold text-slate-900">Strengthening Immunity</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHealthTipModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800">Key practices for the changing season:</p>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                <li>Stay hydrated with 2.5–3 liters of warm water daily.</li>
                <li>Ensure adequate Vitamin C and Zinc from fresh citrus fruits and leafy greens.</li>
                <li>Avoid unprescribed antibiotics for viral seasonal coughs.</li>
                <li>Keep your annual influenza vaccination updated if advised by your physician.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsHealthTipModalOpen(false)}
              className="w-full py-2.5 bg-[#C2410C] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
