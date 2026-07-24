const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

// Generate a deterministic color from a string (user name)
const getColorFromName = (name) => {
  const colors = [
    'bg-primary-500',
    'bg-accent',
    'bg-success',
    'bg-warning',
    'bg-error',
    'bg-primary-600',
    'bg-primary-400',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-violet-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from name (max 2 characters)
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Avatar({ user, size = 'md', className = '' }) {
  const sizeClass = sizeMap[size] || sizeMap.md;

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || 'User'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-slate-700 ${className}`}
      />
    );
  }

  const bgColor = getColorFromName(user?.name || 'Unknown');
  const initials = getInitials(user?.name);

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center font-medium text-white ring-2 ring-slate-700 select-none ${className}`}
      title={user?.name || 'Unknown'}
    >
      {initials}
    </div>
  );
}
