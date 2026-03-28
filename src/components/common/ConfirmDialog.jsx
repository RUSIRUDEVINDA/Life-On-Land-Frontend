const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  const buttonClass =
    tone === 'danger'
      ? 'bg-danger-medium hover:bg-danger-dark'
      : 'bg-primary-medium hover:bg-primary-dark';

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-primary-dark">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${buttonClass}`}
            disabled={loading}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
