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
  const heartSizes = {
    sm: 26,
    md: 34,
    lg: 44,
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const heartPx = heartSizes[size];

  return (
    <div
      onClick={onClick}
      className={`flex flex-col select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center gap-2">
        {/* Coral-red Heart Icon with inner white checkmark */}
        <svg
          width={heartPx}
          height={heartPx}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Heart path */}
          <path
            d="M24 41.5C24 41.5 6 29.5 6 17C6 10.5 11 6 17.5 6C21.2 6 24 8.5 24 8.5C24 8.5 26.8 6 30.5 6C37 6 42 10.5 42 17C42 29.5 24 41.5 24 41.5Z"
            fill="#F05336"
          />
          {/* Inner dark heart center outline */}
          <path
            d="M24 33C24 33 13 25 13 16.5C13 12 16.5 9 20.5 9C23 9 24 10.5 24 10.5C24 10.5 25 9 27.5 9C31.5 9 35 12 35 16.5C35 25 24 33 24 33Z"
            fill="#1E293B"
          />
          {/* White checkmark inside the heart */}
          <path
            d="M19 16.5L22.5 20L29 13.5"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Brand Name Text: Ayu in slate-900, Health in coral-red */}
        <div className="flex items-baseline font-black tracking-tight leading-none">
          <span className={`${titleSizes[size]} text-slate-900 font-extrabold`}>Ayu</span>
          <span className={`${titleSizes[size]} text-[#F05336] font-bold ml-1.5`}>Health</span>
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
