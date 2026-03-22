import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import DocumentsTable from '../components/documents/DocumentsTable';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flashMessage =
    (location.state as { flashMessage?: string } | null)?.flashMessage ?? '';

  return (
    <MainLayout>
      <PageHeader title="Documents">
        <Button
          onClick={() =>
            navigate('/documents/new', {
              state: {
                returnTo: `${location.pathname}${location.search}`,
                sourceLabel: 'All Documents',
              },
            })
          }
        >
          Create Document
        </Button>
      </PageHeader>

      {flashMessage && <p className="document-meta">{flashMessage}</p>}

      <DocumentsTable />
    </MainLayout>
  );
}
