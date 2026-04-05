/** Shown when the dev proxy or load balancer cannot reach the API (502/503). */
export const UPSTREAM_UNAVAILABLE_MESSAGE =
  'Cannot reach the API server. Start the backend (default http://localhost:5001) or set VITE_API_PROXY_TARGET in .env to match your API.';

export function throwIfUpstreamError(response) {
  if (response.status === 502 || response.status === 503) {
    throw new Error(UPSTREAM_UNAVAILABLE_MESSAGE);
  }
}
