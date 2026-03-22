export const API_BASE = 'http://127.0.0.1:5052/api';

const AUTH_STORAGE_KEY = 'folio.auth.user';

function getAuthenticatedUserId(): string | null {
  const value = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    const user = JSON.parse(value) as { id?: number };
    if (!user.id || user.id <= 0) {
      return null;
    }

    return String(user.id);
  } catch {
    return null;
  }
}

export function buildApiHeaders(includeJsonContentType: boolean): HeadersInit {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const authenticatedUserId = getAuthenticatedUserId();
  if (authenticatedUserId) {
    headers['X-Auth-User-Id'] = authenticatedUserId;
  }

  return headers;
}

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: buildApiHeaders(false),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<TResponse, TBody>(
  endpoint: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: buildApiHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep fallback message when API does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<TResponse>;
}
