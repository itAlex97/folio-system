import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import DocumentsTable from '../components/documents/DocumentsTable';
import { useNavigate } from 'react-router-dom';

export default function DocumentsPage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageHeader title="Documents">
        <Button onClick={() => navigate('/documents/new')}>
          Create Document
        </Button>
      </PageHeader>
      <DocumentsTable />
    </MainLayout>
  );
}
