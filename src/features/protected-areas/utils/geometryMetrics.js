import turfArea from '@turf/area';
import booleanIntersects from '@turf/boolean-intersects';
import booleanOverlap from '@turf/boolean-overlap';
import booleanContains from '@turf/boolean-contains';

export const parseGeometryInput = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
};

export const toFeature = (value) => {
  const parsed = parseGeometryInput(value);
  if (!parsed) return null;

  if (parsed.type === 'Feature') return parsed;
  if (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon') {
    return { type: 'Feature', properties: {}, geometry: parsed };
  }

  if (parsed.geometry && (parsed.geometry.type === 'Polygon' || parsed.geometry.type === 'MultiPolygon')) {
    return { type: 'Feature', properties: parsed.properties || {}, geometry: parsed.geometry };
  }

  return null;
};

export const geometryAreaSquareMeters = (value) => {
  const feature = toFeature(value);
  if (!feature) return null;

  try {
    const area = turfArea(feature);
    return Number.isFinite(area) ? area : null;
  } catch {
    return null;
  }
};

export const geometryAreaKm2 = (value) => {
  const areaSqMeters = geometryAreaSquareMeters(value);
  if (areaSqMeters === null) return '';
  return String((areaSqMeters / 1_000_000).toFixed(2));
};

export const geometryAreaHa = (value) => {
  const areaSqMeters = geometryAreaSquareMeters(value);
  if (areaSqMeters === null) return '';
  return String((areaSqMeters / 10_000).toFixed(2));
};

export const geometriesOverlap = (geometryA, geometryB) => {
  const featureA = toFeature(geometryA);
  const featureB = toFeature(geometryB);

  if (!featureA || !featureB) return false;

  try {
    if (!booleanIntersects(featureA, featureB)) return false;

    // True overlap means shared interior area; touching boundaries is allowed.
    return (
      booleanOverlap(featureA, featureB) ||
      booleanContains(featureA, featureB) ||
      booleanContains(featureB, featureA)
    );
  } catch {
    return false;
  }
};
