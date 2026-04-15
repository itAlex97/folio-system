export interface AdminUser {
  id: number;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
  programCode: string;
  programName?: string | null;
}

export interface CatalogProgram {
  code: string;
  name?: string | null;
}

export interface CatalogDocumentType {
  code: string;
  name?: string | null;
}

export interface CatalogFamily {
  id: number;
  name: string;
  programCode: string;
}

export interface AdminCatalogsResponse {
  programs: CatalogProgram[];
  documentTypes: CatalogDocumentType[];
  families: CatalogFamily[];
}

export interface ReportCountByStatus {
  status: string;
  count: number;
}

export interface ReportCountByType {
  type: string;
  count: number;
}

export interface ReportCountByProgram {
  program: string;
  count: number;
}

export interface AdminReportDocument {
  id: number;
  folio: string;
  type: string;
  program: string;
  status: string;
  responsible: string;
  createdBy: string;
  created: string;
}

export interface AdminReportsResponse {
  byStatus: ReportCountByStatus[];
  byType: ReportCountByType[];
  byProgram: ReportCountByProgram[];
  latest: AdminReportDocument[];
}
