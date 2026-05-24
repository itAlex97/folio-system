import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  RotateCcw,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import DocumentDetail from '../components/documents/DocumentDetail';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PageHeader from '../components/common/PageHeader';
import DocumentForm from '../components/documents/DocumentForm';
import { useDocument } from '../hooks/useDocument';
import type { Document } from '../types/document';
import {
  cancelDocument,
  changeDocumentStatus,
  closeDocument,
  deleteDocument,
  reopenDocument,
  updateDocument,
} from '../services/documentService';
import { useAuth } from '../auth/useAuth';
import { useDocumentFormOptions } from '../hooks/useDocumentFormOptions';

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
  const [isEditing, setIsEditing] = useState(false);
  const [documentOverride, setDocumentOverride] = useState<Document | null>(
    null,
  );
  const { user } = useAuth();
  const {
    options: formOptions,
    loading: formOptionsLoading,
    error: formOptionsError,
  } = useDocumentFormOptions();

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
  const normalizedRole = user?.role?.toUpperCase() ?? '';
  const isResponsibleEngineer =
    normalizedRole === 'ENGINEER' &&
    user?.id === effectiveDocument?.responsibleEngineerId;
  const isLeader = normalizedRole === 'LEADER';
  const isAdmin = normalizedRole === 'ADMIN';
  const isLeaderInProgram =
    isLeader && user?.programCode === effectiveDocument?.program;
  const canCloseDocument =
    currentStatus === 'OPEN' && (isResponsibleEngineer || isAdmin);
  const canCancelDocument =
    currentStatus === 'OPEN' &&
    (isLeaderInProgram || isResponsibleEngineer || isAdmin);
  const canEditDocument =
    currentStatus === 'OPEN' &&
    (isResponsibleEngineer || isLeaderInProgram || isAdmin);
  const canReopenDocument = isAdmin && currentStatus !== 'OPEN';
  const canDeleteDocument = isAdmin && currentStatus !== 'CLOSED';

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title={`Document ${id ?? ''}`}>
          <Button variant="secondary" onClick={() => navigate(returnTo)}>
            <ArrowLeft size={16} className="button-icon" />
            Back
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
            <ArrowLeft size={16} className="button-icon" />
            Back
          </Button>
        </PageHeader>

        <p className="document-meta">
          {error
            ? `Unable to load document: ${error}`
            : 'This document could not be found.'}
        </p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title={`Document ${effectiveDocument.folio}`}>
        <Button variant="secondary" onClick={() => navigate(returnTo)}>
          <ArrowLeft size={16} className="button-icon" />
          Back
        </Button>

        {!isEditing && canEditDocument && (
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => {
              setActionError('');
              setFlashMessage('');
              setIsEditing(true);
            }}
          >
            <Edit size={16} className="button-icon" />
            Edit
          </Button>
        )}

        {!isEditing && canCloseDocument && (
          <Button
            variant="success"
            disabled={isSubmitting}
            onClick={async () => {
              try {
                setIsSubmitting(true);
                setActionError('');

                const updatedDocument = await closeDocument(
                  effectiveDocument.id,
                );
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
            <CheckCircle size={16} className="button-icon" />
            Close
          </Button>
        )}

        {!isEditing && canCancelDocument && (
          <Button
            variant="danger"
            disabled={isSubmitting}
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle size={16} className="button-icon" />
            Cancel
          </Button>
        )}

        {!isEditing && canReopenDocument && (
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={async () => {
              const reason =
                window.prompt('Reason to reopen this document:')?.trim() ?? '';
              if (!reason) {
                return;
              }

              try {
                setIsSubmitting(true);
                setActionError('');

                const updatedDocument = await reopenDocument(
                  effectiveDocument.id,
                  reason,
                );
                setDocumentOverride(updatedDocument);
                setFlashMessage('Document reopened successfully.');
              } catch (submitIssue) {
                setActionError(
                  submitIssue instanceof Error
                    ? submitIssue.message
                    : 'Unable to reopen document.',
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <RotateCcw size={16} className="button-icon" />
            Reopen
          </Button>
        )}

        {!isEditing && isAdmin && (
          <Button
            variant="secondary"
            disabled={isSubmitting}
            onClick={async () => {
              const statusPrompt = window.prompt(
                'New status (OPEN, CLOSED, CANCELLED):',
                currentStatus,
              );
              const normalizedStatus = statusPrompt?.trim().toUpperCase() ?? '';

              if (
                normalizedStatus !== 'OPEN' &&
                normalizedStatus !== 'CLOSED' &&
                normalizedStatus !== 'CANCELLED'
              ) {
                return;
              }

              const nextStatus = normalizedStatus as
                | 'OPEN'
                | 'CLOSED'
                | 'CANCELLED';

              const reason =
                window.prompt('Reason for status change:')?.trim() ?? '';
              if (!reason) {
                return;
              }

              try {
                setIsSubmitting(true);
                setActionError('');

                const updatedDocument = await changeDocumentStatus(
                  effectiveDocument.id,
                  nextStatus,
                  reason,
                );
                setDocumentOverride(updatedDocument);
                setFlashMessage(`Document status changed to ${nextStatus}.`);
              } catch (submitIssue) {
                setActionError(
                  submitIssue instanceof Error
                    ? submitIssue.message
                    : 'Unable to change status.',
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <RefreshCw size={16} className="button-icon" />
            Change Status
          </Button>
        )}

        {!isEditing && canDeleteDocument && (
          <Button
            variant="danger"
            disabled={isSubmitting}
            onClick={async () => {
              const confirmDelete = window.confirm(
                'Delete this document? CLOSED documents cannot be deleted.',
              );
              if (!confirmDelete) {
                return;
              }

              const reason =
                window.prompt('Reason for deletion:')?.trim() ?? '';
              if (!reason) {
                return;
              }

              try {
                setIsSubmitting(true);
                setActionError('');

                await deleteDocument(effectiveDocument.id, reason);

                navigate(returnTo, {
                  replace: true,
                  state: { flashMessage: 'Document deleted successfully.' },
                });
              } catch (submitIssue) {
                setActionError(
                  submitIssue instanceof Error
                    ? submitIssue.message
                    : 'Unable to delete document.',
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <Trash2 size={16} className="button-icon" />
            Delete
          </Button>
        )}
      </PageHeader>

      <p className="document-meta">
        {sourceLabel} / {effectiveDocument.type} / {effectiveDocument.folio}
      </p>

      {flashMessage && <p className="document-meta">{flashMessage}</p>}
      {actionError && (
        <p className="document-meta">
          Unable to update document: {actionError}
        </p>
      )}

      {!isEditing && <DocumentDetail document={effectiveDocument} />}

      {isEditing && formOptions && (
        <DocumentForm
          initialType={effectiveDocument.type}
          isTypeLocked
          initialProgramCode={effectiveDocument.program}
          isProgramLocked
          initialValues={{
            familyId: effectiveDocument.familyId,
            responsibleEngineerId: effectiveDocument.responsibleEngineerId,
            modelYear: effectiveDocument.modelYear ?? '',
            phase: effectiveDocument.phase ?? '',
            carLeaderId: effectiveDocument.carLeaderId ?? undefined,
            changeDescription: effectiveDocument.changeDescription ?? '',
            associatedDocument: effectiveDocument.associatedDocument ?? '',
            composite: effectiveDocument.composite ?? '',
            issue: effectiveDocument.issue ?? '',
            dreId: effectiveDocument.dreId ?? undefined,
          }}
          options={formOptions}
          loading={formOptionsLoading || isSubmitting}
          error={actionError || formOptionsError}
          submitLabel="Save Changes"
          showReassignmentReason={isLeaderInProgram}
          initialResponsibleEngineerId={effectiveDocument.responsibleEngineerId}
          onCancel={() => {
            if (!isSubmitting) {
              setIsEditing(false);
              setActionError('');
            }
          }}
          onSubmit={async (values) => {
            try {
              setIsSubmitting(true);
              setActionError('');

              const updatedDocument = await updateDocument(
                effectiveDocument.id,
                {
                  familyId: values.familyId,
                  responsibleEngineerId: values.responsibleEngineerId,
                  reassignmentReason: values.reassignmentReason,
                  modelYear: values.modelYear,
                  phase: values.phase,
                  carLeaderId: values.carLeaderId,
                  changeDescription: values.changeDescription,
                  associatedDocument: values.associatedDocument,
                  composite: values.composite,
                  issue: values.issue,
                  dreId: values.dreId,
                },
              );

              setDocumentOverride(updatedDocument);
              setFlashMessage('Document updated successfully.');
              setIsEditing(false);
            } catch (submitIssue) {
              setActionError(
                submitIssue instanceof Error
                  ? submitIssue.message
                  : 'Unable to update document.',
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}

      {isEditing && !formOptions && (
        <p className="document-meta">
          {formOptionsLoading
            ? 'Loading edit form options...'
            : `Unable to load edit form options: ${formOptionsError}`}
        </p>
      )}

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

              const updatedDocument = await cancelDocument(
                effectiveDocument.id,
              );
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
