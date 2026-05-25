import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { getAdminReportsSummary } from '../services/adminService';
import type { AdminReportsResponse } from '../types/admin';

const EMPTY_REPORTS: AdminReportsResponse = {
  byStatus: [],
  byType: [],
  byProgram: [],
  latest: [],
};

export default function AdminHomePage() {
  const [reports, setReports] = useState<AdminReportsResponse>(EMPTY_REPORTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReports() {
    try {
      setLoading(true);
      const next = await getAdminReportsSummary();
      setReports(next);
      setError('');
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Unable to load admin metrics.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  const totalDocuments = reports.byStatus.reduce(
    (total, item) => total + item.count,
    0,
  );
  const openDocuments =
    reports.byStatus.find((item) => item.status === 'OPEN')?.count ?? 0;
  const closedDocuments =
    reports.byStatus.find((item) => item.status === 'CLOSED')?.count ?? 0;
  const cancelledDocuments =
    reports.byStatus.find((item) => item.status === 'CANCELLED')?.count ?? 0;

  return (
    <MainLayout>
      <PageHeader title="Administracion">
        <Button variant="secondary" onClick={() => void loadReports()}>
          Refresh
        </Button>
      </PageHeader>

      <p className="document-meta">
        System overview separated from the normal document workspace.
      </p>
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="document-meta">Loading admin metrics...</p>}

      {!loading && (
        <>
          <div className="overview-grid">
            <div className="overview-card">
              <span className="overview-label">Total Documents</span>
              <span className="overview-value">{totalDocuments}</span>
            </div>

            <div className="overview-card">
              <span className="overview-label">Open</span>
              <span className="overview-value">{openDocuments}</span>
            </div>

            <div className="overview-card">
              <span className="overview-label">Closed</span>
              <span className="overview-value">{closedDocuments}</span>
            </div>

            <div className="overview-card">
              <span className="overview-label">Cancelled</span>
              <span className="overview-value">{cancelledDocuments}</span>
            </div>
          </div>

          <div className="overview-grid admin-metrics-grid">
            {reports.byType.map((item) => (
              <div className="overview-card" key={`type-${item.type}`}>
                <span className="overview-label">{item.type}</span>
                <span className="overview-value">{item.count}</span>
              </div>
            ))}

            {reports.byProgram.map((item) => (
              <div className="overview-card" key={`program-${item.program}`}>
                <span className="overview-label">{item.program}</span>
                <span className="overview-value">{item.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </MainLayout>
  );
}
