import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  QrCode,
  User,
  Settings,
  Globe,
  HelpCircle,
  LogOut,
  Heart,
  Check,
} from 'lucide-react';
import { UserProfile } from '../../types/clinical';
import { ScanDoctorQrModal } from '../features/ScanDoctorQrModal';

interface AyuAccountViewProps {
  profile?: UserProfile | null;
  onBack: () => void;
  onNavigateToEditProfile: () => void;
  onNavigateToSettings?: () => void;
  onLogout: () => void;
  onConnectDoctorSession: (code: string) => void;
}

export const AyuAccountView: React.FC<AyuAccountViewProps> = ({
  profile,
  onBack,
  onNavigateToEditProfile,
  onNavigateToSettings,
  onLogout,
  onConnectDoctorSession,
}) => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.preferredLanguage || 'English');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const languages = ['English', 'हिंदी (Hindi)', 'తెలుగు (Telugu)', 'தமிழ் (Tamil)', 'मराठी (Marathi)', 'বাংলা (Bengali)', 'ಕನ್ನಡ (Kannada)'];

  const fullName = profile?.fullName && profile.fullName.trim()
    ? profile.fullName.trim()
    : (profile?.mobile ? `User ${profile.mobile.slice(-4)}` : 'Take Care Patient');

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account</h2>
        </div>

        {/* User Name */}
        <div className="pt-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{fullName}</h1>
          {profile?.mobile && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">+91 {profile.mobile}</p>
          )}
        </div>

        {/* Dark Oval Security Card */}
        <div className="bg-[#1A2E2B] rounded-3xl p-5 text-white shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-white">
            <Lock className="w-5 h-5 text-teal-300" />
          </div>
          <div className="text-xs leading-relaxed font-medium">
            Your medical records are <span className="text-teal-300 font-bold">encrypted & secure</span>. You remain in{' '}
            <span className="text-teal-300 font-bold">full control</span> of access.
          </div>
        </div>

        {/* Menu Buttons List */}
        <div className="space-y-2.5 pt-2">
          {/* Scan Doctor's QR Code */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <QrCode className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-bold text-slate-900 group-hover:text-[#006D60] transition">
              Scan Doctor's QR code
            </span>
          </button>

          {/* Edit Profile */}
          <button
            type="button"
            onClick={onNavigateToEditProfile}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <User className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-bold text-slate-900 group-hover:text-[#006D60] transition">
              Edit Profile
            </span>
          </button>

          {/* Settings & Permissions */}
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
            >
              <Settings className="w-5 h-5 text-slate-700" />
              <span className="text-sm font-bold text-slate-900 group-hover:text-[#006D60] transition">
                Settings &amp; Permissions
              </span>
            </button>
          )}

          {/* Change Language */}
          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(true)}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <Globe className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-bold text-slate-900 group-hover:text-[#006D60] transition">
              Change Language
            </span>
            <span className="ml-auto text-xs font-semibold text-slate-400">
              {selectedLanguage}
            </span>
          </button>

          {/* Help */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <HelpCircle className="w-5 h-5 text-slate-700" />
            <span className="text-sm font-bold text-slate-900 group-hover:text-[#006D60] transition">
              Help & Support
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-4 px-5 bg-white hover:bg-rose-50/50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <LogOut className="w-5 h-5 text-slate-700 group-hover:text-rose-600" />
            <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Footer Motto & Quotation */}
      <div className="pt-6 pb-24 flex flex-col items-center justify-center text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-[#006D60] text-xs font-bold tracking-widest uppercase shadow-2xs">
          <Heart className="w-4 h-4 text-[#006D60] fill-[#006D60]" />
          <span>DESIGNED FOR HEALTH</span>
        </div>
        <p className="text-xs text-slate-500 italic max-w-xs px-4">
          “Take care of your body. It's the only place you have to live.”
        </p>
        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          Take Care Health • v2.4.0 Secure
        </span>
      </div>

      {/* QR Code Scanner Modal */}
      <ScanDoctorQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onConnectDoctorCode={onConnectDoctorSession}
      />

      {/* Language Selector Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Select Language</h3>
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLanguageModalOpen(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left text-xs font-bold transition flex items-center justify-between ${
                    selectedLanguage === lang
                      ? 'bg-teal-50 text-teal-900 border border-teal-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{lang}</span>
                  {selectedLanguage === lang && (
                    <Check className="w-4 h-4 text-[#006D60]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Help & Support</h3>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <p>For assistance with digitizing prescriptions, clinical records, or account deletion, reach out to our dedicated clinical support team:</p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-[11px] text-slate-800">
                <p>Email: support@takecare.health</p>
                <p>Helpline: 1800-209-CARE (Toll Free)</p>
                <p>Hours: Mon - Sat, 9:00 AM - 8:00 PM IST</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
