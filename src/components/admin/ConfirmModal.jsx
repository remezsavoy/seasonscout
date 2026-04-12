import { Button } from '../ui/Button';

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Confirm action</p>
        <h3 className="mt-3 text-2xl font-semibold text-ink">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-ink/68">{description}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} variant="ghost">
            {cancelLabel}
          </Button>
          <Button className="bg-coral hover:bg-coral/90" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
