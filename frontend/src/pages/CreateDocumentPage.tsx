import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DocumentForm from '../components/documents/DocumentForm';
import Button from '../components/common/Button';
import type { DocumentType } from '../types/document';

interface CreateDocumentNavigationState {
  prefillType?: DocumentType;
  returnTo?: string;
  sourceLabel?: string;
}

const VALID_TYPES = new Set(['BCN', 'DCN', 'DFM']);

export default function CreateDocumentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationState =
    (location.state as CreateDocumentNavigationState | null) ?? null;

  const prefillType = VALID_TYPES.has(navigationState?.prefillType ?? '')
    ? navigationState?.prefillType
    : '';
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

      <DocumentForm
        initialType={prefillType}
        isTypeLocked={Boolean(prefillType)}
        onCancel={() => navigate(returnTo)}
        onSubmit={(values) =>
          navigate(returnTo, {
            state: {
              flashMessage: `Document ${values.type} prepared successfully.`,
            },
          })
        }
      />
    </MainLayout>
  );
}
