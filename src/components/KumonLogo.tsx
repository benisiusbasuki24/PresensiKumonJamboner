import React from 'react';

interface KumonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const KumonLogo: React.FC<KumonLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeClasses = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Kumon Thinking Face Icon Badge */}
      <div className="relative flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className={`${sizeClasses[size]} w-auto aspect-square drop-shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Kumon Blue Circle Badge */}
          <circle cx="50" cy="50" r="48" fill="#00A0E9" />
          {/* Eyes of thinking face */}
          <circle cx="37" cy="44" r="5.5" fill="#FFFFFF" />
          <circle cx="63" cy="44" r="5.5" fill="#FFFFFF" />
          {/* Thinking face gentle smile */}
          <path
            d="M34 62 C42 73, 58 73, 66 62"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: KUMON + JAMBON */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-[#00A0E9] text-xl md:text-2xl font-sans uppercase">
            KUMON
          </span>
          <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded bg-[#00A0E9]/10 text-[#007BB5] tracking-wider uppercase border border-[#00A0E9]/20">
            JAMBON
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] md:text-[11px] font-medium text-slate-500 tracking-wide">
            Sistem Presensi Resmi Cabang
          </span>
        )}
      </div>
    </div>
  );
};
