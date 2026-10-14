import React, { useState } from 'react';
import { UserProfile } from '../../types/clinical';
import { ScanDoctorQrModal } from '../features/ScanDoctorQrModal';

interface AyuAccountViewProps {
  profile?: UserProfile | null;
  onBack: () => void;
  onNavigateToEditProfile: () => void;
  onLogout: () => void;
  onConnectDoctorSession: (code: string) => void;
}

export const AyuAccountView: React.FC<AyuAccountViewProps> = ({
  profile,
  onBack,
  onNavigateToEditProfile,
  onLogout,
  onConnectDoctorSession,
}) => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.preferredLanguage || 'English');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const languages = ['English', 'हिंदी (Hindi)', 'తెలుగు (Telugu)', 'தமிழ் (Tamil)', 'मराठी (Marathi)', 'বাংলা (Bengali)', 'ಕನ್ನಡ (Kannada)'];

  const fullName = profile?.fullName || 'Siva Reddy';

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none">
      <div className="space-y-5">
        {/* Top Header (Matching Image 5) */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
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

        {/* Dark Oval Security Card (Matching Image 5) */}
        <div className="bg-[#2E2836] rounded-3xl p-5 text-white shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </div>
          <div className="text-xs leading-relaxed font-medium">
            Your data is <span className="text-[#F05336] font-bold">secure</span>, you are in{' '}
            <span className="text-[#F05336] font-bold">control</span> of your data.
          </div>
        </div>

        {/* Menu Buttons List (Matching Image 5) */}
        <div className="space-y-2.5 pt-2">
          {/* Scan Doctor's QR Code */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              qr_code_scanner
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Scan Doctor's QR code
            </span>
          </button>

          {/* Edit Profile */}
          <button
            type="button"
            onClick={onNavigateToEditProfile}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              person_outline
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Edit Profile
            </span>
          </button>

          {/* Change Language */}
          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(true)}
            className="w-full py-4 px-5 bg-white hover:bg-slate-50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              language
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
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
            <span className="material-symbols-outlined text-slate-800 text-[22px]">
              support
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
              Help
            </span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-4 px-5 bg-white hover:bg-rose-50/50 border border-slate-200/70 rounded-full shadow-2xs flex items-center gap-3.5 text-left transition cursor-pointer group active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-slate-800 group-hover:text-rose-600 text-[22px]">
              logout
            </span>
            <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Footer (Matching Image 5) */}
      <div className="py-6 flex justify-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-200/60 text-slate-600 text-xs font-semibold">
          <span>Made with</span>
          <span className="text-[#F05336]">❤️</span>
          <span>from Mumbai</span>
        </div>
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
                    <span className="material-symbols-outlined text-[16px] text-teal-600">check</span>
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
                <p>Email: support@ayuhealth.in</p>
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
