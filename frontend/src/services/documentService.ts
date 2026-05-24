import { API_BASE, apiFetch, buildApiHeaders } from '../api/client';
import type { Document, DocumentStatus, DocumentType } from '../types/document';

interface EngineeringChangeApiResponse {
  id: number;
  familyId: number;
  responsibleEngineerId: number;
  folio: string;
  type: string;
  program: string;
  family: string;
  responsible: string;
  createdBy: string;
  modelYear?: string | null;
  phase?: string | null;
  status: string;
  created: string;
  closedAt?: string | null;
  carLeaderId?: number | null;
  carLeader?: string | null;
  changeDescription?: string | null;
  associatedDocument?: string | null;
  composite?: string | null;
  issue?: string | null;
  dreId?: number | null;
  dreName?: string | null;
}

interface CreateEngineeringChangeRequest {
  type: DocumentType;
  programCode: string;
  familyId: number;
  responsibleEngineerId: number;
  modelYear: string;
  phase: string;
  carLeaderId?: number;
  changeDescription?: string;
  associatedDocument?: string;
  composite?: string;
  issue?: string;
  dreId?: number;
}

interface UpdateEngineeringChangeRequest {
  familyId: number;
  responsibleEngineerId: number;
  reassignmentReason?: string;
  modelYear: string;
  phase: string;
  carLeaderId?: number;
  changeDescription?: string;
  associatedDocument?: string;
  composite?: string;
  issue?: string;
  dreId?: number;
}

interface DocumentQuery {
  search?: string;
  type?: DocumentType;
  program?: string;
  status?: DocumentStatus | '';
  modelYear?: string;
  phase?: string;
}

function mapDocument(apiDocument: EngineeringChangeApiResponse): Document {
  return {
    id: apiDocument.id,
    familyId: apiDocument.familyId,
    responsibleEngineerId: apiDocument.responsibleEngineerId,
    folio: apiDocument.folio,
    type: apiDocument.type as DocumentType,
    program: apiDocument.program,
    family: apiDocument.family,
    responsible: apiDocument.responsible,
    createdBy: apiDocument.createdBy,
    modelYear: apiDocument.modelYear ?? null,
    phase: apiDocument.phase ?? null,
    status: apiDocument.status as DocumentStatus,
    created: apiDocument.created,
    closedAt: apiDocument.closedAt ?? null,
    carLeaderId: apiDocument.carLeaderId ?? null,
    carLeader: apiDocument.carLeader ?? null,
    changeDescription: apiDocument.changeDescription ?? null,
    associatedDocument: apiDocument.associatedDocument ?? null,
    composite: apiDocument.composite ?? null,
    issue: apiDocument.issue ?? null,
    dreId: apiDocument.dreId ?? null,
    dreName: apiDocument.dreName ?? null,
  };
}

export async function getDocuments(
  query: DocumentQuery = {},
): Promise<Document[]> {
  const searchParams = new URLSearchParams();

  if (query.search) searchParams.set('search', query.search);
  if (query.type) searchParams.set('type', query.type);
  if (query.program) searchParams.set('program', query.program);
  if (query.status) searchParams.set('status', query.status);
  if (query.modelYear) searchParams.set('modelYear', query.modelYear);
  if (query.phase) searchParams.set('phase', query.phase);

  const endpoint = searchParams.size
    ? `/engineering-changes?${searchParams.toString()}`
    : '/engineering-changes';

  const documents = await apiFetch<EngineeringChangeApiResponse[]>(endpoint);
  return documents.map(mapDocument);
}

export async function getDocumentById(id: number): Promise<Document> {
  const document = await apiFetch<EngineeringChangeApiResponse>(
    `/engineering-changes/${id}`,
  );
  return mapDocument(document);
}

export async function createDocument(
  payload: CreateEngineeringChangeRequest,
): Promise<Document> {
  const response = await fetch(`${API_BASE}/engineering-changes`, {
    method: 'POST',
    headers: buildApiHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep the fallback message when the backend does not return JSON.
    }

    throw new Error(message);
  }

  const document = (await response.json()) as EngineeringChangeApiResponse;
  return mapDocument(document);
}

export async function updateDocument(
  id: number,
  payload: UpdateEngineeringChangeRequest,
): Promise<Document> {
  const response = await fetch(`${API_BASE}/engineering-changes/${id}`, {
    method: 'PATCH',
    headers: buildApiHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  const document = (await response.json()) as EngineeringChangeApiResponse;
  return mapDocument(document);
}

async function patchDocumentStatus(
  id: number,
  action: 'close' | 'cancel',
): Promise<Document> {
  const response = await fetch(
    `${API_BASE}/engineering-changes/${id}/${action}`,
    {
      method: 'PATCH',
      headers: buildApiHeaders(false),
    },
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  const document = (await response.json()) as EngineeringChangeApiResponse;
  return mapDocument(document);
}

async function patchDocumentStatusWithBody(
  id: number,
  action: 'reopen' | 'status',
  payload: { status?: DocumentStatus; reason: string },
): Promise<Document> {
  const response = await fetch(
    `${API_BASE}/engineering-changes/${id}/${action}`,
    {
      method: 'PATCH',
      headers: buildApiHeaders(true),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  const document = (await response.json()) as EngineeringChangeApiResponse;
  return mapDocument(document);
}

export function closeDocument(id: number): Promise<Document> {
  return patchDocumentStatus(id, 'close');
}

export function cancelDocument(id: number): Promise<Document> {
  return patchDocumentStatus(id, 'cancel');
}

export function reopenDocument(id: number, reason: string): Promise<Document> {
  return patchDocumentStatusWithBody(id, 'reopen', { reason });
}

export function changeDocumentStatus(
  id: number,
  status: DocumentStatus,
  reason: string,
): Promise<Document> {
  return patchDocumentStatusWithBody(id, 'status', { status, reason });
}

export async function deleteDocument(
  id: number,
  reason: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/engineering-changes/${id}`, {
    method: 'DELETE',
    headers: buildApiHeaders(true),
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }
}
