import MainLayout from '../components/layout/MainLayout';
import { useParams } from 'react-router-dom';
import DocumentDetail from '../components/documents/DocumentDetail';
import Button from '../components/common/Button';
import { useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  return (
    <MainLayout>
      <h1 style={{ marginBottom: '24px' }}>Document {id}</h1>
      <p>Document ID: {id}</p>
      <DocumentDetail />
      <div className="document-actions">
        <Button>Close Document</Button>
        <Button variant="danger" onClick={() => setShowCancelDialog(true)}>
          Cancel Document
        </Button>
      </div>
      {showCancelDialog && (
        <ConfirmDialog
          title="Cancel Document"
          message="Are you sure you want to cancel this document?"
          onCancel={() => setShowCancelDialog(false)}
          onConfirm={() => {
            console.log('Document cancelled');
            setShowCancelDialog(false);
          }}
        />
      )}
    </MainLayout>
  );
}
