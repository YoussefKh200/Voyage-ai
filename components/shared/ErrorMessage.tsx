// components/shared/ErrorMessage.tsx
// ─── Inline error display ─────────────────────────────────────────────────────

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`glass rounded-xl p-4 border border-rose-500/30 bg-rose-500/5 ${className ?? ""}`}
    >
      <p className="text-rose-400 text-sm flex items-center gap-2">
        <span aria-hidden="true">⚠️</span>
        {message}
      </p>
    </div>
  );
}
