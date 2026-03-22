import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import DocumentDetail from '../components/documents/DocumentDetail';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PageHeader from '../components/common/PageHeader';
import { useDocument } from '../hooks/useDocument';
import type { Document } from '../types/document';

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
  const [statusOverride, setStatusOverride] = useState<{
    documentId: number;
    status: Document['status'];
  } | null>(null);

  const navigationState =
    (location.state as DetailNavigationState | null) ?? null;
  const returnTo = navigationState?.returnTo ?? '/documents';
  const sourceLabel = navigationState?.sourceLabel ?? 'Documents';
  const numericId = id ? Number(id) : null;
  const { document, loading, error } = useDocument(numericId);
  const currentStatus =
    document && statusOverride?.documentId === document.id
      ? statusOverride.status
      : document?.status ?? null;

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

  if (!document || !currentStatus) {
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

  const documentWithStatus: Document = {
    ...document,
    status: currentStatus,
  };

  return (
    <MainLayout>
      <PageHeader title={`Document ${document.folio}`}>
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          Back to list
        </Button>
      </PageHeader>

      <p className="document-meta">
        {sourceLabel} / {document.type} / {document.folio}
      </p>

      {flashMessage && <p className="document-meta">{flashMessage}</p>}

      <DocumentDetail document={documentWithStatus} />

      <div className="document-actions">
        <Button
          disabled={currentStatus !== 'OPEN'}
          onClick={() => {
            setStatusOverride({
              documentId: document.id,
              status: 'CLOSED',
            });
            setFlashMessage('Document closed successfully.');
          }}
        >
          Close Document
        </Button>

        <Button
          variant="danger"
          disabled={currentStatus === 'CANCELLED'}
          onClick={() => setShowCancelDialog(true)}
        >
          Cancel Document
        </Button>
      </div>

      {showCancelDialog && (
        <ConfirmDialog
          title="Cancel Document"
          message="Are you sure you want to cancel this document?"
          onCancel={() => setShowCancelDialog(false)}
          onConfirm={() => {
            setStatusOverride({
              documentId: document.id,
              status: 'CANCELLED',
            });
            setFlashMessage('Document cancelled successfully.');
            setShowCancelDialog(false);
          }}
        />
      )}
    </MainLayout>
  );
}
