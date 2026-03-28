const Loading = ({ label = 'Loading...' }) => (
  <div className="flex min-h-[220px] items-center justify-center">
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
      {label}
    </div>
  </div>
);

export default Loading;
