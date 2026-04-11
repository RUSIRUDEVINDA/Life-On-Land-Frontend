/** Shown when the dev proxy or load balancer cannot reach the API (502/503). */
export const UPSTREAM_UNAVAILABLE_MESSAGE =
  'Cannot reach the API server. In local development, start the backend on http://localhost:5001 or set VITE_API_PROXY_TARGET. In production, point VITE_API_URL to your deployed backend.';

export function throwIfUpstreamError(response) {
  if (response.status === 502 || response.status === 503) {
    throw new Error(UPSTREAM_UNAVAILABLE_MESSAGE);
  }
}