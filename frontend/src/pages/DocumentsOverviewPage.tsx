import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { useDocuments } from '../hooks/useDocuments';

export default function DocumentsOverviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, loading, error } = useDocuments();
  const flashMessage =
    (location.state as { flashMessage?: string } | null)?.flashMessage ?? '';

  const total = documents.length;
  const open = documents.filter((d) => d.status === 'OPEN').length;
  const closed = documents.filter((d) => d.status === 'CLOSED').length;
  const cancelled = documents.filter((d) => d.status === 'CANCELLED').length;

  return (
    <MainLayout>
      <PageHeader title="Documents Overview">
        <Button
          onClick={() =>
            navigate('/documents/new', {
              state: {
                returnTo: `${location.pathname}${location.search}`,
                sourceLabel: 'Documents Overview',
              },
            })
          }
        >
          Create Document
        </Button>
      </PageHeader>

      <p className="document-meta">
        Use this page as the main entry point to review document health by type.
      </p>

      {flashMessage && <p className="document-meta">{flashMessage}</p>}
      {loading && <p className="document-meta">Loading documents from backend...</p>}
      {error && <p className="document-meta">Unable to load data: {error}</p>}

      <div className="overview-grid">
        <div className="overview-card">
          <span className="overview-label">Total</span>
          <span className="overview-value">{total}</span>
        </div>

        <div className="overview-card">
          <span className="overview-label">Open</span>
          <span className="overview-value">{open}</span>
        </div>

        <div className="overview-card">
          <span className="overview-label">Closed</span>
          <span className="overview-value">{closed}</span>
        </div>

        <div className="overview-card">
          <span className="overview-label">Cancelled</span>
          <span className="overview-value">{cancelled}</span>
        </div>
      </div>

      <div className="document-actions">
        <Button variant="secondary" onClick={() => navigate('/documents/bcn')}>
          View BCN
        </Button>
        <Button variant="secondary" onClick={() => navigate('/documents/dcn')}>
          View DCN
        </Button>
        <Button variant="secondary" onClick={() => navigate('/documents/dfm')}>
          View DFM
        </Button>
      </div>
    </MainLayout>
  );
}
