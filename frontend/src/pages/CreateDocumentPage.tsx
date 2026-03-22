import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DocumentForm from '../components/documents/DocumentForm';
import Button from '../components/common/Button';
import { useAuth } from '../auth/useAuth';
import type { DocumentType } from '../types/document';
import { useDocumentFormOptions } from '../hooks/useDocumentFormOptions';
import { createDocument } from '../services/documentService';

interface CreateDocumentNavigationState {
  prefillType?: DocumentType;
  returnTo?: string;
  sourceLabel?: string;
}

const VALID_TYPES = new Set(['BCN', 'DCN', 'DFM']);

export default function CreateDocumentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { options, loading, error } = useDocumentFormOptions();
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigationState =
    (location.state as CreateDocumentNavigationState | null) ?? null;

  const prefillType = VALID_TYPES.has(navigationState?.prefillType ?? '')
    ? navigationState?.prefillType
    : '';
  const prefillProgramCode = user?.programCode ?? '';
  const returnTo = navigationState?.returnTo ?? '/documents';
  const sourceLabel = navigationState?.sourceLabel ?? 'Documents';

  return (
    <MainLayout>
      <PageHeader title="Create Document">
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          Back to list
        </Button>
      </PageHeader>

      <p className="document-meta">
        Creating from {sourceLabel}. After saving, you will return there.
      </p>

      {options && (
        <DocumentForm
          initialType={prefillType}
          isTypeLocked={Boolean(prefillType)}
          initialProgramCode={prefillProgramCode}
          isProgramLocked={Boolean(prefillProgramCode)}
          options={options}
          loading={loading || submitting}
          error={submitError || error}
          onCancel={() => navigate(returnTo)}
          onSubmit={async (values) => {
            try {
              if (!user) {
                setSubmitError(
                  'Your session is not available. Please sign in again.',
                );
                return;
              }

              setSubmitting(true);
              setSubmitError('');

              const createdDocument = await createDocument(values);

              navigate(`/documents/${createdDocument.id}`, {
                state: {
                  returnTo,
                  sourceLabel,
                },
              });
            } catch (submitIssue) {
              setSubmitError(
                submitIssue instanceof Error
                  ? submitIssue.message
                  : 'Unable to create document.',
              );
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}

      {!options && loading && (
        <p className="document-meta">Loading create document options...</p>
      )}

      {!options && error && (
        <p className="document-meta">Unable to load create form: {error}</p>
      )}
    </MainLayout>
  );
}
