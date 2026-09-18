export default function EmptyState({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-14 px-6">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-paper font-medium">{title}</p>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center px-5 py-2.5 rounded-full bg-rose text-white text-sm font-medium hover:bg-rose-dim transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
