import React, { useState } from 'react';
import {
  ScanLine,
  FolderClock,
  FileHeart,
  Share2,
  Bell,
  Sparkles,
  Camera,
  Mic,
  ChevronDown,
  User,
  Settings,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { ProcessedDocument, UserProfile } from '../types/clinical';
import { TakeCareLogo } from './common/AppLogo';
import { InjuryCameraModal } from './assistant/InjuryCameraModal';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);

  const firstName = profile?.fullName && profile.fullName.trim()
    ? profile.fullName.trim().split(' ')[0]
    : (profile?.mobile ? `User ${profile.mobile.slice(-4)}` : 'there');

  // Calculate profile completion percentage based on actual required health fields
  const calculateCompletion = (p?: UserProfile | null) => {
    if (!p) return 0;
    let score = 0;
    if (p.fullName && p.fullName.trim()) score += 20;
    if (p.dob || p.age) score += 15;
    if (p.gender) score += 15;
    if (p.bloodGroup && p.bloodGroup !== 'Not Documented') score += 15;
    if (p.emergencyContactName && p.emergencyContactPhone) score += 20;
    if (p.hasHighBp !== undefined || p.hasDiabetes !== undefined || p.latestBp || p.latestBloodSugar) score += 15;
    return Math.min(100, score);
  };

  const completionPercent = calculateCompletion(profile);

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (askQuery.trim()) {
      if (onOpenAskAyuWithQuery) {
        onOpenAskAyuWithQuery(askQuery.trim());
      } else {
        onNavigate('ask-ayu');
      }
    } else {
      onNavigate('ask-ayu');
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between px-4 sm:px-6 pb-24 max-w-md mx-auto w-full select-none relative"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 18px)' }}
    >
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <TakeCareLogo size="md" />

          <div className="flex items-center gap-2 relative">
            {/* User Pill with Profile Completion Circular Ring */}
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="pl-2 pr-3 py-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-300"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={completionPercent === 100 ? "text-emerald-600" : "text-[#006D60]"}
                    strokeDasharray={`${completionPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <User className="w-3 h-3 text-slate-700 absolute" />
              </div>
              <span className="truncate max-w-[90px]">{firstName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-11 z-30 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 w-52 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('account');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>My Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('profile-edit');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Edit Profile</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${completionPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {completionPercent}%
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('family');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#006D60] hover:bg-teal-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#006D60]" />
                  <span>Family</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span>Settings &amp; Permissions</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Incomplete Profile Alert Card */}
        {completionPercent < 100 && (
          <div
            onClick={() => onNavigate('profile-edit')}
            className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs cursor-pointer active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#006D60] text-white flex items-center justify-center shrink-0 font-bold text-xs">
                {completionPercent}%
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  Welcome to Take Care • Complete your profile
                </span>
                <span className="text-[11px] text-slate-600 block">
                  Add blood group, emergency contact &amp; health status
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#006D60] shrink-0" />
          </div>
        )}

        {/* Greeting */}
        <div className="pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Hello {firstName}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Where should we start?
          </h1>
        </div>

        {/* Primary Action Card: Scan medical documents */}
        <div
          onClick={() => onNavigate('upload')}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#006D60] to-[#004D40] text-white shadow-md active:scale-[0.99] transition cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5 max-w-[80%]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wide uppercase">
                <ShieldCheck className="w-3 h-3 text-teal-200" />
                AI Health OCR
              </span>
              <h2 className="text-lg font-bold text-white">Scan Medical Documents</h2>
              <p className="text-xs text-teal-100 leading-relaxed">
                Scan prescriptions, discharge summaries or lab tests. AI extracts medicines and vitals instantly.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-teal-100">
            <span>Tap to scan with camera or upload file</span>
            <span className="inline-flex items-center gap-1 text-white font-bold">
              Scan <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Real Core Action Items List (No fictional entries) */}
        <div className="space-y-2.5 pt-1">
          {/* 1. My medical history */}
          <button
            type="button"
            onClick={() => onNavigate('documents')}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <FolderClock className="w-5 h-5 text-[#006D60]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 block truncate">
                My medical history
              </span>
              <span className="text-xs text-slate-500">
                {documents.length > 0
                  ? 'Processed records, prescriptions & lab results'
                  : 'No medical records uploaded yet • Tap Scan to start'}
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
              {documents.length > 0 ? `${documents.length} files` : '0 files'}
            </span>
          </button>

          {/* 2. Take Photo of Wound / Burn / Visible Injury */}
          <button
            type="button"
            onClick={() => setIsInjuryModalOpen(true)}
            className="w-full py-3.5 px-4 bg-white hover:bg-rose-50/40 border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 block truncate">
                Take Photo • Wounds &amp; Burns
              </span>
              <span className="text-xs text-slate-500">
                AI visual inspection &amp; immediate first-aid advice
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
              Check
            </span>
          </button>

          {/* 3. Health Summary */}
          <button
            type="button"
            onClick={() => onNavigate('summary')}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <FileHeart className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 block truncate">
                AI Health Summary
              </span>
              <span className="text-xs text-slate-500">
                Consolidated clinical summary and active medications
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* 4. Share with Doctor */}
          <button
            type="button"
            onClick={() => onNavigate('share')}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-indigo-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 block truncate">
                Share with Doctor
              </span>
              <span className="text-xs text-slate-500">
                Generate 6-digit access code for secure doctor view
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* 5. Medicine Reminders */}
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-900 block truncate">
                Medicine reminders
              </span>
              <span className="text-xs text-slate-500">
                Never miss your prescribed dose or schedule
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Integrated Ask Care Assistant Bar */}
      <div className="pt-4 mt-4">
        <form
          onSubmit={handleAskSubmit}
          className="flex items-center gap-2 bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-sm"
        >
          <div
            onClick={() => onNavigate('ask-ayu')}
            className="flex-1 flex items-center gap-2.5 px-3 py-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#006D60] shrink-0" />
            <input
              type="text"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="Ask Care anything about your health..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsInjuryModalOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-600 transition shrink-0 cursor-pointer"
            title="Take photo of wound or burn"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('ask-ayu')}
            className="w-9 h-9 rounded-xl bg-[#006D60] hover:bg-[#005a4f] flex items-center justify-center text-white transition shrink-0 cursor-pointer"
            title="Voice query"
          >
            <Mic className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Injury Camera Modal */}
      <InjuryCameraModal
        isOpen={isInjuryModalOpen}
        onClose={() => setIsInjuryModalOpen(false)}
        onSavedToRecords={(doc) => {
          onSelectDocument(doc);
          onNavigate('documents');
        }}
      />
    </div>
  );
};
