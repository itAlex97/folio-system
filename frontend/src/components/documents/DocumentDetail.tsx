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
        <span className="field-label">Model Year</span>
        <span className="field-value">{document.modelYear ?? 'N/A'}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Phase</span>
        <span className="field-value">{document.phase ?? 'N/A'}</span>
      </div>

      <div className="document-field">
        <span className="field-label">Status</span>
        <DocumentStatusBadge status={document.status} />
      </div>

      <div className="document-field">
        <span className="field-label">Created</span>
        <span className="field-value">{document.created}</span>
      </div>

      {document.carLeader && (
        <div className="document-field">
          <span className="field-label">Car Leader</span>
          <span className="field-value">{document.carLeader}</span>
        </div>
      )}

      {document.associatedDocument && (
        <div className="document-field">
          <span className="field-label">Associated Document</span>
          <span className="field-value">{document.associatedDocument}</span>
        </div>
      )}

      {document.changeDescription && (
        <div className="document-field">
          <span className="field-label">Change Description</span>
          <span className="field-value">{document.changeDescription}</span>
        </div>
      )}

      {document.composite && (
        <div className="document-field">
          <span className="field-label">Composite</span>
          <span className="field-value">{document.composite}</span>
        </div>
      )}

      {document.issue && (
        <div className="document-field">
          <span className="field-label">Issue</span>
          <span className="field-value">{document.issue}</span>
        </div>
      )}

      {document.dreName && (
        <div className="document-field">
          <span className="field-label">DRE</span>
          <span className="field-value">{document.dreName}</span>
        </div>
      )}
    </div>
  );
}
