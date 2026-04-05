import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProtectedAreaMap from '../../features/protected-areas/components/ProtectedAreaMap';
import Loading from '../../components/common/Loading';
import Alert from '../../components/common/Alert';
import { protectedAreaService } from '../../services/protectedAreaService';

const zoneLegend = [
  { key: 'CORE', label: 'Core (Strict Protection)', swatch: '#f03e3e', border: '#c92a2a' },
  { key: 'BUFFER', label: 'Buffer (Limited Use)', swatch: '#ffe066', border: '#e67700' },
  { key: 'EDGE', label: 'Edge (Transition)', swatch: '#ffc078', border: '#f08c00' },
  { key: 'CORRIDOR', label: 'Corridor (Wildlife Movement)', swatch: '#69db7c', border: '#2b8a3e' },
];

const ProtectedAreasMapPage = () => {
  const [areas, setAreas] = useState([]);
  const [zonesByArea, setZonesByArea] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const allZones = useMemo(() => Object.values(zonesByArea).flat(), [zonesByArea]);
  const areaCount = areas.length;
  const zoneCount = allZones.length;
  const areasWithZones = useMemo(
    () => areas.filter((area) => (zonesByArea[area.id] || []).length > 0).length,
    [areas, zonesByArea]
  );
  const avgZonesPerArea = areaCount ? (zoneCount / areaCount).toFixed(1) : '0.0';

  const loadMapData = async () => {
    setLoading(true);
    setError('');

    try {
      const protectedAreas = await protectedAreaService.getProtectedAreas();
      setAreas(protectedAreas);

      const zoneEntries = await Promise.allSettled(
        protectedAreas.map(async (area) => {
          const zones = await protectedAreaService.getZonesByProtectedAreaId(area.id);
          return [area.id, zones];
        })
      );

      const safeZoneMap = {};
      zoneEntries.forEach((entry, index) => {
        const areaId = protectedAreas[index]?.id;
        if (!areaId) return;

        safeZoneMap[areaId] = entry.status === 'fulfilled' ? entry.value[1] : [];
      });

      setZonesByArea(safeZoneMap);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load map data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-border-light bg-white shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light px-5 py-4">
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight text-primary-dark">Protected Areas &amp; Zones Map</h2>
            <p className="mt-1 text-[13px] text-text-gray">View all conservation areas and their biodiversity zones</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadMapData}
              className="rounded-xl border border-border-light bg-white px-4 py-2.5 text-[13px] font-semibold text-primary-dark transition hover:bg-bg-soft"
            >
              Refresh Map
            </button>
            <Link
              to="/dashboard/protected-areas"
              className="rounded-xl bg-primary-medium px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-dark"
            >
              Manage Areas
            </Link>
            <Link
              to="/dashboard/protected-areas/zones"
              className="rounded-xl border border-border-light bg-white px-4 py-2 text-[12px] font-semibold text-primary-dark transition hover:bg-bg-soft"
            >
              Manage Zones
            </Link>
          </div>
        </div>

        <div className="p-5">
          {loading ? <Loading label="Loading protected area geometries..." /> : <ProtectedAreaMap areas={areas} zones={allZones} />}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border-light border-t-[3px] border-t-primary-dark bg-white px-5 py-4 shadow-sm">
          <p className="text-[30px] leading-none font-semibold text-primary-dark">{areaCount}</p>
          <p className="mt-1 text-[13px] text-text-gray">Protected Areas</p>
        </article>

        <article className="rounded-2xl border border-border-light border-t-[3px] border-t-primary-medium bg-white px-5 py-4 shadow-sm">
          <p className="text-[30px] leading-none font-semibold text-primary-medium">{zoneCount}</p>
          <p className="mt-1 text-[13px] text-text-gray">Total Zones</p>
        </article>

        <article className="rounded-2xl border border-border-light border-t-[3px] border-t-primary-dark bg-white px-5 py-4 shadow-sm">
          <p className="text-[30px] leading-none font-semibold text-primary-dark">{areasWithZones}</p>
          <p className="mt-1 text-[13px] text-text-gray">Areas with Zones</p>
        </article>

        <article className="rounded-2xl border border-border-light border-t-[3px] border-t-primary-medium bg-white px-5 py-4 shadow-sm">
          <p className="text-[30px] leading-none font-semibold text-primary-medium">{avgZonesPerArea}</p>
          <p className="mt-1 text-[13px] text-text-gray">Avg Zones per Area</p>
        </article>
      </div>

      <section className="rounded-2xl border border-border-light bg-white px-6 py-6 shadow-sm">
        <h3 className="text-[24px] font-semibold leading-[1.15] text-primary-dark">
          Zone Types Legend
        </h3>

        <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          {zoneLegend.map((zone) => (
            <div key={zone.key} className="flex items-center gap-3">
              <span
                className="h-6 w-6 rounded-md border-2"
                style={{ backgroundColor: zone.swatch, borderColor: zone.border }}
                aria-hidden="true"
              />
              <span className="text-[15px] font-semibold text-primary-dark">{zone.label}</span>
            </div>
          ))}
        </div>
      </section>

      <Alert type="danger" message={error} />
    </div>
  );
};

export default ProtectedAreasMapPage;
