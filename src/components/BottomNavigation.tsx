import React from 'react';
import { Home, FolderClock, Sparkles, Stethoscope, User } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentTab, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'documents', label: 'History', icon: FolderClock },
    { id: 'ask-ayu', label: 'Ask Care', icon: Sparkles },
    { id: 'doctor-access', label: 'Doctor', icon: Stethoscope },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-lg">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[56px] py-1 transition-colors ${
                isActive ? 'text-[#006D60] font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`}
              />
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-bold text-[#006D60]' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
