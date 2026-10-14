import React, { useState } from 'react';
import { UserProfile } from '../types/clinical';

interface NavigationHeaderProps {
  currentTab: string;
  profile?: UserProfile | null;
  isDemoMode?: boolean;
  onNavigate: (tab: string) => void;
  onOpenDoctorPortal: () => void;
  onOpenAcceptanceTests: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onExitDemoMode?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentTab,
  profile,
  isDemoMode = false,
  onNavigate,
  onOpenDoctorPortal,
  onOpenAcceptanceTests,
  onOpenProfile,
  onOpenSettings,
  onExitDemoMode,
  showBack,
  onBack,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getTitle = () => {
    switch (currentTab) {
      case 'home':
        return 'Home';
      case 'documents':
        return 'Documents';
      case 'upload':
        return 'Upload Flow';
      case 'verification':
        return 'Visual Verification';
      case 'summary':
        return 'Summary';
      case 'share':
        return 'Share';
      case 'abdm':
        return 'ABDM';
      case 'doctor-access':
        return 'View Patient Summary';
      case 'profile':
        return 'Profile';
      case 'profile-edit':
        return 'Edit Profile';
      case 'settings':
        return 'Settings';
      default:
        return 'Take Care';
    }
  };

  const displayName = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : 'Account';

  const avatarInitial = profile?.fullName
    ? profile.fullName.charAt(0).toUpperCase()
    : 'P';

  return (
    <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-md mx-auto w-full px-4">
        {/* iOS-style Status Bar Area */}
        <div className="h-5 flex items-center justify-between text-slate-700 text-xs pt-1 px-0.5 font-medium">
          <span className="font-semibold tracking-tight">9:41</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="material-symbols-outlined text-[15px]">signal_cellular_alt</span>
            <span className="material-symbols-outlined text-[15px]">wifi</span>
            <span className="material-symbols-outlined text-[16px]">battery_full</span>
          </div>
        </div>

        {/* Demo Mode Notice Banner in Header if active */}
        {isDemoMode && (
          <div className="py-1 px-2.5 my-1 bg-amber-500 text-white rounded-lg flex items-center justify-between text-[11px] font-bold shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">science</span>
              <span>DEMO MODE (Fictional Data)</span>
            </div>
            {onExitDemoMode && (
              <button
                type="button"
                onClick={onExitDemoMode}
                className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition cursor-pointer"
              >
                Exit Demo
              </button>
            )}
          </div>
        )}

        {/* Primary Header Row */}
        <div className="h-14 flex items-center justify-between gap-2">
          {/* Left: Brand Logo / Back Button */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
            ) : (
              <div
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition">
                  <span className="material-symbols-outlined text-[20px]">local_hospital</span>
                </div>
                <span className="font-bold text-slate-900 text-base tracking-tight truncate hidden sm:inline">
                  Take Care
                </span>
              </div>
            )}
          </div>

          {/* Center: Title */}
          <div className="flex-1 text-center min-w-0 px-1">
            <h1 className="font-bold text-slate-900 text-[16px] truncate">
              {getTitle()}
            </h1>
          </div>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center justify-end min-w-0 flex-1 gap-1.5 relative">
            {/* Quick link to acceptance tests suite */}
            <button
              onClick={onOpenAcceptanceTests}
              title="Acceptance Tests Suite"
              className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">checklist</span>
              <span className="hidden xs:inline">Tests</span>
            </button>

            {/* Doctor Portal shortcut */}
            <button
              onClick={onOpenDoctorPortal}
              title="Doctor Access"
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">stethoscope</span>
              <span className="hidden xs:inline">Doctor</span>
            </button>

            {/* User Profile Avatar with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 pl-1 cursor-pointer focus:outline-none"
                aria-label="User menu"
              >
                <span className="hidden xs:inline-block text-xs text-slate-700 font-semibold truncate max-w-[65px]">
                  {displayName}
                </span>
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs border border-teal-800/20 shadow-2xs hover:ring-2 hover:ring-teal-400 transition">
                  {avatarInitial}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-40 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-xs text-slate-700 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">
                        {profile?.fullName || 'Patient Account'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {profile?.mobile ? `+91 ${profile.mobile}` : 'Logged In'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenProfile) onOpenProfile();
                        else onNavigate('profile');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px] text-teal-600">person</span>
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenSettings) onOpenSettings();
                        else onNavigate('settings');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-500">settings</span>
                      <span>Settings &amp; Permissions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('doctor-access');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px] text-slate-500">stethoscope</span>
                      <span>Doctor Access Code</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenSettings) onOpenSettings();
                        else onNavigate('settings');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
