const ProtectedAreaList = ({
  areas,
  onEdit,
  onDelete,
  onManageZones,
  selectedAreaId,
}) => {
  if (!areas.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-light bg-white p-6 text-sm text-text-gray">
        No protected areas available yet.
      </div>
    );
  }

  const formatAreaType = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return 'PROTECTED AREA';
    return normalized.replaceAll('_', ' ').toUpperCase();
  };

  const formatStatus = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return 'ACTIVE';
    return normalized.replaceAll('_', ' ').toUpperCase();
  };

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => {
        const isSelected = selectedAreaId === area.id;

        return (
          <article
            key={area.id}
            className={`rounded-xl border bg-white p-5 shadow-sm transition ${
              isSelected ? 'border-primary-light ring-1 ring-primary-light/35' : 'border-border-light'
            }`}
          >
            <h3 className="text-[18px] font-semibold leading-tight text-primary-dark sm:text-[20px]">{area.name}</h3>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-bg-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-dark/80">
                {formatAreaType(area.areaType)}
              </span>
              <span className="rounded-md bg-primary-light/20 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-dark/85">
                {formatStatus(area.status)}
              </span>
            </div>

            <div className="mt-4 space-y-1.5 text-[14px] leading-relaxed text-primary-dark/80">
              <p>
                <span className="font-semibold text-primary-dark">District:</span>{' '}
                {area.district || '-'}
              </p>
              <p>
                <span className="font-semibold text-primary-dark">Area Size:</span>{' '}
                {area.areaSize ? `${area.areaSize} km2` : '-'}
              </p>
              <p>
                <span className="font-semibold text-primary-dark">Description:</span>{' '}
                {area.description || '-'}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onManageZones(area)}
                className="min-w-[104px] rounded-xl border border-border-light bg-bg-soft px-3.5 py-1.5 text-[12px] font-semibold text-primary-dark transition hover:bg-primary-light/20"
              >
                View Zones
              </button>
              <button
                type="button"
                onClick={() => onEdit(area)}
                className="min-w-[84px] rounded-xl bg-primary-medium px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-primary-dark"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(area)}
                className="min-w-[84px] rounded-xl bg-danger-medium px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-danger-dark"
              >
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ProtectedAreaList;
