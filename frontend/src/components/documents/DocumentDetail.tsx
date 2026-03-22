import type { Document } from '../../types/document';
import DocumentStatusBadge from './DocumentStatusBadge';

interface Props {
  document: Document;
}

export default function DocumentDetail({ document }: Props) {
  return (
    <div className="document-card">
      <div className="document-field">
        <span className="field-label">Folio</span>
        <span className="field-value">{document.folio}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Type</span>
        <span className="field-value">{document.type}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Program</span>
        <span className="field-value">{document.program}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Family</span>
        <span className="field-value">{document.family}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Responsible</span>
        <span className="field-value">{document.responsible}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Status</span>
        <DocumentStatusBadge status={document.status} />
      </div>

      <div className="document-field">
        <span className="field-label">Created</span>
        <span className="field-value">{document.created}</span>
      </div>
    </div>
  );
}
