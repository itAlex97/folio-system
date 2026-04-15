export type DocumentStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export type DocumentType = 'BCN' | 'DCN' | 'DFM';

export interface Document {
  id: number;
  familyId: number;
  responsibleEngineerId: number;
  folio: string;
  type: DocumentType;
  program: string;
  family: string;
  responsible: string;
  createdBy: string;
  modelYear?: string | null;
  phase?: string | null;
  status: DocumentStatus;
  created: string;
  closedAt?: string | null;
  carLeader?: string | null;
  changeDescription?: string | null;
  associatedDocument?: string | null;
  composite?: string | null;
  issue?: string | null;
  target?: string | null;
}
