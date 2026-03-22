import { apiFetch } from '../api/client';
import type { Document, DocumentStatus, DocumentType } from '../types/document';

interface EngineeringChangeApiResponse {
  id: number;
  folio: string;
  type: string;
  program: string;
  family: string;
  responsible: string;
  status: string;
  created: string;
  title?: string | null;
  description?: string | null;
  closedAt?: string | null;
}

function mapDocument(apiDocument: EngineeringChangeApiResponse): Document {
  return {
    id: apiDocument.id,
    folio: apiDocument.folio,
    type: apiDocument.type as DocumentType,
    program: apiDocument.program,
    family: apiDocument.family,
    responsible: apiDocument.responsible,
    status: apiDocument.status as DocumentStatus,
    created: apiDocument.created,
    title: apiDocument.title ?? null,
    description: apiDocument.description ?? null,
    closedAt: apiDocument.closedAt ?? null,
  };
}

export async function getDocuments(): Promise<Document[]> {
  const documents = await apiFetch<EngineeringChangeApiResponse[]>('/engineering-changes');
  return documents.map(mapDocument);
}

export async function getDocumentById(id: number): Promise<Document> {
  const document = await apiFetch<EngineeringChangeApiResponse>(`/engineering-changes/${id}`);
  return mapDocument(document);
}
