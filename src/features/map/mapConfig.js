/** Shared map style for MapLibre (Map Tracking + Risk Map). */
export const MAPTILER_KEY = String(import.meta.env.VITE_MAPTILER_KEY || '').trim();
export const MAP_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://demotiles.maplibre.org/style.json';
