import DocumentStatusBadge from './DocumentStatusBadge';

interface Document {
  folio: string;
  type: string;
  program: string;
  family: string;
  responsible: string;
  status: string;
  created: string;
}

const mockDocument: Document = {
  folio: 'Y2XX-26-BCN-0001',
  type: 'BCN',
  program: 'Y2XX',
  family: 'ENGINE',
  responsible: 'Juan Perez',
  status: 'OPEN',
  created: '2026-03-03',
};

export default function DocumentDetail() {
  return (
    <div className="document-card">
      <div className="document-field">
        <span className="field-label">Folio</span>
        <span className="field-value">{mockDocument.folio}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Type</span>
        <span className="field-value">{mockDocument.type}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Program</span>
        <span className="field-value">{mockDocument.program}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Family</span>
        <span className="field-value">{mockDocument.family}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Responsible</span>
        <span className="field-value">{mockDocument.responsible}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Status</span>
        <DocumentStatusBadge status={mockDocument.status} />
      </div>

      <div className="document-field">
        <span className="field-label">Created</span>
        <span className="field-value">{mockDocument.created}</span>
      </div>
    </div>
  );
}
