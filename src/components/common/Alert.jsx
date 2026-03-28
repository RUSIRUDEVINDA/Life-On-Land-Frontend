const variants = {
  info: 'border-secondary-medium/40 bg-secondary-light/30 text-secondary-dark',
  success: 'border-primary-medium/40 bg-primary-light/25 text-primary-dark',
  danger: 'border-danger-medium/35 bg-danger-light/35 text-danger-dark',
};

const Alert = ({ type = 'info', message }) => {
  if (!message) return null;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${variants[type] || variants.info}`}>
      {message}
    </div>
  );
};

export default Alert;
