const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('tw_token');
}

export function setToken(token: string) {
  localStorage.setItem('tw_token', token);
}

export function clearToken() {
  localStorage.removeItem('tw_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || 'Request failed');
  }
  return res.json();
}

// Auth
export const api = {
  register: (email: string, password: string, name?: string) =>
    request<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<{ id: number; email: string; name: string | null; has_chart: boolean }>('/user/me'),

  // Chart
  createChart: (data: {
    birth_datetime_utc: string;
    birth_location?: string;
    birth_latitude?: number;
    birth_longitude?: number;
    timezone_str?: string;
  }) => request<any>('/chart', { method: 'POST', body: JSON.stringify(data) }),

  getChart: () => request<any>('/chart'),

  // Transit
  getCurrentTransit: () => request<any>('/transit/current'),
  getOverlay: () => request<any>('/transit/overlay'),
  getOverlayByDate: (date: string) => request<any>(`/transit/by-date?date=${date}`),

  // Transit Tools
  getUpcomingChanges: () => request<any>('/transit/upcoming-changes'),
  getSunTracker: () => request<any>('/transit/sun-tracker'),
  getEphemeris: (startDate: string, days: number = 30) =>
    request<any>(`/transit/ephemeris?start_date=${startDate}&days=${days}`),
  interpretCell: (planet: string, gate: number, line: number, date: string) =>
    request<any>('/transit/interpret-cell', {
      method: 'POST',
      body: JSON.stringify({ planet, gate, line, date }),
    }),

  // Interpretation
  getDailyInterpretation: () => request<any>('/interpret/daily'),

  // Journal
  getJournalEntries: () => request<any[]>('/journal'),
  createJournalEntry: (content: string, date?: string) =>
    request<any>('/journal', {
      method: 'POST',
      body: JSON.stringify({ content, date }),
    }),
  getJournalEntry: (date: string) => request<any>(`/journal/${date}`),
  deleteJournalEntry: (date: string) =>
    request<any>(`/journal/${date}`, { method: 'DELETE' }),
};
