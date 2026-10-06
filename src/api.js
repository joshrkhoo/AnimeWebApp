// CRA resolves REACT_APP_* variables at build time (.env.production / .env.development)
const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://anime-web-app-api-production.up.railway.app';

const SESSION_KEY = 'animeSchedule.session';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// The session ({ token, user }) lives in localStorage so it survives reloads.
// The API is on a different domain, so a cookie would be a blocked third-party cookie.
export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable (private mode); the session just won't persist
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const token = loadSession()?.token;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized();
    throw new ApiError(data?.error || `Something went wrong (${response.status}).`, response.status);
  }
  return data;
}

export const api = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  search: (text, signal) => request(`/search?q=${encodeURIComponent(text)}`, { signal }),
  browse: (kind) => request(`/browse/${kind}`),
  details: (id) => request(`/anime/${id}`),

  // Returns { schedule: [...], wishlist: [...], promoted: [...] }
  library: () => request('/library'),
  // Returns { show, list } where list is 'schedule' or 'wishlist'
  addToLibrary: (id) => request('/library', { method: 'POST', body: { id } }),
  removeFromLibrary: (id) => request(`/library/${id}`, { method: 'DELETE' }),
};
