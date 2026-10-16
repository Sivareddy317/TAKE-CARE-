import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

/**
 * Ayu Health App Icon as shown in user screenshot (Image 2):
 * Deep teal circular icon with white rounded square border enclosing a white medical cross.
 */
export const AppIcon: React.FC<AppIconProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 select-none ${className}`}
    >
      {/* Outer circular badge in teal (#006D60 / #00796B) */}
      <circle cx="60" cy="60" r="58" fill="#006D60" />

      {/* Inner white rounded-square container border */}
      <rect
        x="30"
        y="30"
        width="60"
        height="60"
        rx="10"
        stroke="#FFFFFF"
        strokeWidth="7"
        fill="none"
      />

      {/* Bold white medical plus (+) */}
      {/* Vertical bar */}
      <rect x="54" y="42" width="12" height="36" rx="2" fill="#FFFFFF" />
      {/* Horizontal bar */}
      <rect x="42" y="54" width="36" height="12" rx="2" fill="#FFFFFF" />
    </svg>
  );
};

interface AyuHealthLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Ayu Health Logo as shown in user screenshots (Images 3, 4, 10, 11, 12):
 * Coral/Orange Heart with internal tick/heart, bold "Ayu" + coral "Health",
 * and optional "Paperless Medical History powered by AI" subtitle.
 */
export const AyuHealthLogo: React.FC<AyuHealthLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  onClick,
}) => {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 42,
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconPx = iconSizes[size];

  return (
    <div
      onClick={onClick}
      className={`flex flex-col select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {/* Take Care Medical Cross Badge Icon */}
        <AppIcon size={iconPx} />

        {/* Brand Name Text: TAKE in slate-900, CARE in teal (#006D60) */}
        <div className="flex items-baseline font-black tracking-tight leading-none">
          <span className={`${titleSizes[size]} text-slate-900 font-extrabold`}>TAKE</span>
          <span className={`${titleSizes[size]} text-[#006D60] font-bold ml-1.5`}>CARE</span>
        </div>
      </div>

      {showSubtitle && (
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          Paperless Medical History <br className="sm:hidden" />
          <span className="text-slate-800 font-semibold">powered by AI</span>
        </p>
      )}
    </div>
  );
};

export const TakeCareLogo = AyuHealthLogo;

