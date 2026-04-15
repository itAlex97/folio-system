import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
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
  const prefilledTypeLabel =
    options?.documentTypes.find(
      (documentType) => documentType.code === prefillType,
    )?.name ?? prefillType;
  const prefilledProgramLabel =
    options?.programs.find((program) => program.code === prefillProgramCode)
      ?.name ?? prefillProgramCode;

  return (
    <MainLayout>
      <PageHeader title="Create Document">
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          <ArrowLeft size={16} className="button-icon" />
          Back
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={loading || submitting}
          onClick={() => navigate(returnTo)}
        >
          <X size={16} className="button-icon" />
          Cancel
        </Button>

        <Button
          type="submit"
          form="create-document-form"
          variant="success"
          disabled={loading || submitting || !options}
        >
          <Save size={16} className="button-icon" />
          Save
        </Button>
      </PageHeader>

      <p className="document-meta">
        Creating from {sourceLabel}. After saving, you will return there.
      </p>

      {options && (
        <div className="form-fixed-context" aria-label="Fixed document context">
          <span className="fixed-context-label">Fixed values</span>
          <span className="fixed-context-chip">
            Type:{' '}
            {prefillType ? `${prefillType} - ${prefilledTypeLabel}` : 'Manual'}
          </span>
          <span className="fixed-context-chip">
            Program:{' '}
            {prefillProgramCode
              ? `${prefillProgramCode} - ${prefilledProgramLabel}`
              : 'Manual'}
          </span>
        </div>
      )}

      {options && (
        <DocumentForm
          className="create-document-form"
          formId="create-document-form"
          showFormActions={false}
          hideLockedFields
          submitLabel="Save"
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
