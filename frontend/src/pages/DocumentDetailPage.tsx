import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DocumentDetail from '../components/documents/DocumentDetail';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PageHeader from '../components/common/PageHeader';
import { useDocument } from '../hooks/useDocument';
import type { Document } from '../types/document';
import { cancelDocument, closeDocument } from '../services/documentService';

interface DetailNavigationState {
  returnTo?: string;
  sourceLabel?: string;
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentOverride, setDocumentOverride] = useState<Document | null>(null);

  const navigationState =
    (location.state as DetailNavigationState | null) ?? null;
  const returnTo = navigationState?.returnTo ?? '/documents';
  const sourceLabel = navigationState?.sourceLabel ?? 'Documents';
  const numericId = id ? Number(id) : null;
  const { document, loading, error } = useDocument(numericId);
  const effectiveDocument =
    documentOverride && document && documentOverride.id === document.id
      ? documentOverride
      : document;
  const currentStatus = effectiveDocument?.status ?? null;

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title={`Document ${id ?? ''}`}>
          <Button variant="secondary" onClick={() => navigate(returnTo)}>
            Back to list
          </Button>
        </PageHeader>

        <p className="document-meta">Loading document from backend...</p>
      </MainLayout>
    );
  }

  if (!effectiveDocument || !currentStatus) {
    return (
      <MainLayout>
        <PageHeader title={`Document ${id ?? ''}`}>
          <Button variant="secondary" onClick={() => navigate(returnTo)}>
            Back to list
          </Button>
        </PageHeader>

        <p className="document-meta">
          {error ? `Unable to load document: ${error}` : 'This document could not be found.'}
        </p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title={`Document ${effectiveDocument.folio}`}>
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          Back to list
        </Button>
      </PageHeader>

      <p className="document-meta">
        {sourceLabel} / {effectiveDocument.type} / {effectiveDocument.folio}
      </p>

      {flashMessage && <p className="document-meta">{flashMessage}</p>}
      {actionError && <p className="document-meta">Unable to update document: {actionError}</p>}

      <DocumentDetail document={effectiveDocument} />

      <div className="document-actions">
        <Button
          disabled={currentStatus !== 'OPEN' || isSubmitting}
          onClick={async () => {
            try {
              setIsSubmitting(true);
              setActionError('');

              const updatedDocument = await closeDocument(effectiveDocument.id);
              setDocumentOverride(updatedDocument);
              setFlashMessage('Document closed successfully.');
            } catch (submitIssue) {
              setActionError(
                submitIssue instanceof Error
                  ? submitIssue.message
                  : 'Unable to close document.',
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          Close Document
        </Button>

        <Button
          variant="danger"
          disabled={currentStatus !== 'OPEN' || isSubmitting}
          onClick={() => setShowCancelDialog(true)}
        >
          Cancel Document
        </Button>
      </div>

      {showCancelDialog && (
        <ConfirmDialog
          title="Cancel Document"
          message="Are you sure you want to cancel this document?"
          onCancel={() => {
            if (!isSubmitting) {
              setShowCancelDialog(false);
            }
          }}
          onConfirm={async () => {
            try {
              setIsSubmitting(true);
              setActionError('');

              const updatedDocument = await cancelDocument(effectiveDocument.id);
              setDocumentOverride(updatedDocument);
              setFlashMessage('Document cancelled successfully.');
              setShowCancelDialog(false);
            } catch (submitIssue) {
              setActionError(
                submitIssue instanceof Error
                  ? submitIssue.message
                  : 'Unable to cancel document.',
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}
    </MainLayout>
  );
}
