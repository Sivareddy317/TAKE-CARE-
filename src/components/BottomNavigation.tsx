import React from 'react';

interface BottomNavigationProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentTab, onNavigate }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'documents', label: 'History', icon: 'schedule' },
    { id: 'ask-ayu', label: 'Ask Ayu', icon: 'auto_awesome' },
    { id: 'doctor-access', label: 'Doctor', icon: 'stethoscope' },
    { id: 'account', label: 'Account', icon: 'person_outline' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-md">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[56px] transition-colors ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'scale-110' : ''} transition-transform`}>
                {tab.icon}
              </span>
              <span className="text-[11px] font-medium tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
