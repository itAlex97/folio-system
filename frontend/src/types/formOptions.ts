import type { DocumentType } from './document';

export interface DocumentTypeOption {
  code: DocumentType;
  name: string;
}

export interface ProgramOption {
  code: string;
  name: string;
}

export interface FamilyOption {
  id: number;
  name: string;
  programCode: string;
}

export interface ResponsibleEngineerOption {
  id: number;
  name: string;
  programCode: string;
}

export interface DocumentFormOptions {
  documentTypes: DocumentTypeOption[];
  programs: ProgramOption[];
  families: FamilyOption[];
  responsibleEngineers: ResponsibleEngineerOption[];
}
