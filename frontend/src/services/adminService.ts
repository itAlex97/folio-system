import { API_BASE, apiFetch, buildApiHeaders } from '../api/client';
import type {
  AdminCatalogsResponse,
  AdminReportsResponse,
  AdminUser,
} from '../types/admin';

interface ApiErrorBody {
  message?: string;
}

async function parseApiError(response: Response): Promise<Error> {
  let message = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.message) {
      message = body.message;
    }
  } catch {
    // Keep fallback message.
  }

  return new Error(message);
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/admin/users');
}

export async function updateAdminUser(
  id: number,
  payload: {
    name: string;
    role: string;
    programCode: string;
    isActive: boolean;
  },
): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PATCH',
    headers: buildApiHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function getAdminCatalogs(): Promise<AdminCatalogsResponse> {
  return apiFetch<AdminCatalogsResponse>('/admin/catalogs');
}

export async function createProgram(payload: {
  code: string;
  name?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/programs`, {
    method: 'POST',
    headers: buildApiHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function createDocumentType(payload: {
  code: string;
  name?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/document-types`, {
    method: 'POST',
    headers: buildApiHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function createFamily(payload: {
  programCode: string;
  name: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/families`, {
    method: 'POST',
    headers: buildApiHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function getAdminReportsSummary(): Promise<AdminReportsResponse> {
  return apiFetch<AdminReportsResponse>('/admin/reports/summary');
}
