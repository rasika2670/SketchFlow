const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

import { getUserColor } from '@/utils/userColors';

// Get initials from name (max 2 characters)
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizeClass = sizeMap[size] || sizeMap.md;

  const color = getUserColor(user?.id || user?.userId, user?.name);

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || 'User'}
        className={`${sizeClass} rounded-full object-cover ring-2 ${className}`}
        style={{ '--tw-ring-color': color }}
      />
    );
  }

  const initials = getInitials(user?.name);

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-slate-900 ring-2 select-none ${className}`}
      style={{ backgroundColor: color, '--tw-ring-color': color }}
      title={user?.name || 'Unknown'}
    >
      {initials}
    </div>
  );
}
