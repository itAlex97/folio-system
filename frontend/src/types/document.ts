export type DocumentStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export type DocumentType = 'BCN' | 'DCN' | 'DFM';

export interface Document {
  id: number;
  folio: string;
  type: DocumentType;
  program: string;
  family: string;
  responsible: string;
  status: DocumentStatus;
  created: string;
  title?: string | null;
  description?: string | null;
  closedAt?: string | null;
}
