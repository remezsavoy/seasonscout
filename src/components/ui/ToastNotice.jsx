import { cn } from '../../lib/cn';

export function ToastNotice({ message, className }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 max-w-sm rounded-[1.25rem] border border-coral/20 bg-ink px-5 py-4 text-sm leading-6 text-white shadow-soft',
        className,
      )}
      role="status"
    >
      {message}
    </div>
  );
}
