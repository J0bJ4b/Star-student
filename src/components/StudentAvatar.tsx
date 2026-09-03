import React, { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { getAvatarBgColor } from '../utils/imageHelper';

interface StudentAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  editable?: boolean;
  onUploadClick?: () => void;
  ringColor?: string;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-16 h-16 text-lg sm:w-20 sm:h-20 sm:text-xl',
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  editable = false,
  onUploadClick,
  ringColor = 'ring-white/20',
}) => {
  const [imgError, setImgError] = useState(false);

  // Extract friendly display initials (e.g., ด.ช. พีช -> พช, or first 2 letters)
  const cleanName = name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|น\.ส\.|เด็กชาย|เด็กหญิง)\s*/, '').trim();
  const initials = cleanName.slice(0, 2) || name.slice(0, 2) || 'ST';
  const bgGradient = getAvatarBgColor(name);

  const containerSize = sizeClasses[size];

  return (
    <div className="relative inline-block shrink-0 group">
      <div
        className={`${containerSize} rounded-full overflow-hidden flex items-center justify-center font-bold select-none transition-all shadow-md ${ringColor} ${className}`}
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-tr ${bgGradient} text-white flex items-center justify-center shadow-inner`}
          >
            {initials ? (
              <span>{initials}</span>
            ) : (
              <User className="w-1/2 h-1/2 opacity-80" />
            )}
          </div>
        )}
      </div>

      {editable && onUploadClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUploadClick();
          }}
          title="เปลี่ยนรูปโปรไฟล์"
          className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white shadow-lg border-2 border-[#150a24] transition-transform hover:scale-110 active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
