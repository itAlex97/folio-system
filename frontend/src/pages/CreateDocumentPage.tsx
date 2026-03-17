import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import DocumentForm from '../components/documents/DocumentForm';

export default function CreateDocumentPage() {
  return (
    <MainLayout>
      <PageHeader title="Create Document" />

      <DocumentForm />
    </MainLayout>
  );
}
