const API_BASE = 'http://127.0.0.1:8000/api';

export async function apiFetch(endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  return response.json();
}
