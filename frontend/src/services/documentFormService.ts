import { apiFetch } from '../api/client';
import type { DocumentFormOptions } from '../types/formOptions';

export async function getDocumentFormOptions(): Promise<DocumentFormOptions> {
  return apiFetch<DocumentFormOptions>('/document-form-options');
}
