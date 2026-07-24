export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-sf-16 px-sf-8 text-center">
      {Icon && (
        <div className="mb-sf-4 p-sf-4 rounded-full bg-slate-800">
          <Icon size={32} className="text-slate-400" />
        </div>
      )}
      {title && (
        <h3 className="text-sf-lg font-semibold text-slate-200 mb-sf-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sf-base text-slate-400 max-w-sm mb-sf-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
