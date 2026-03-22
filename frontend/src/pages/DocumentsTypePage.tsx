import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DocumentsTable from '../components/documents/DocumentsTable';
import Button from '../components/common/Button';
import type { DocumentType } from '../types/document';

interface Props {
  type: DocumentType;
}

const TYPE_COPY: Record<DocumentType, { title: string; sourceLabel: string }> = {
  BCN: {
    title: 'BCN Documents',
    sourceLabel: 'BCN Documents',
  },
  DCN: {
    title: 'DCN Documents',
    sourceLabel: 'DCN Documents',
  },
  DFM: {
    title: 'DFM Documents',
    sourceLabel: 'DFM Documents',
  },
};

export default function DocumentsTypePage({ type }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage =
    (location.state as { flashMessage?: string } | null)?.flashMessage ?? '';

  const { title, sourceLabel } = TYPE_COPY[type];

  return (
    <MainLayout>
      <PageHeader title={title}>
        <Button
          onClick={() =>
            navigate('/documents/new', {
              state: {
                prefillType: type,
                returnTo: `${location.pathname}${location.search}`,
                sourceLabel,
              },
            })
          }
        >
          Create Document
        </Button>
      </PageHeader>

      <p className="document-meta">
        Focused view for {type} records with filters and sorting preserved in
        the URL.
      </p>

      {flashMessage && <p className="document-meta">{flashMessage}</p>}

      <DocumentsTable type={type} />
    </MainLayout>
  );
}
