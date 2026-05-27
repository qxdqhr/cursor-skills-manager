import { useEffect } from 'react';

export function Toast({
  message,
  variant = 'error',
  onClose,
}: {
  message: string;
  variant?: 'error' | 'info';
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [onClose]);

  const colors =
    variant === 'error'
      ? 'border-red-900/80 bg-red-950/90 text-red-100'
      : 'border-zinc-700 bg-zinc-900 text-zinc-200';

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg border px-4 py-3 text-sm shadow-lg ${colors}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-zinc-400 hover:text-white"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
    </div>
  );
}
