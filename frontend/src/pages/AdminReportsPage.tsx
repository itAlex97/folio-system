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

export default function AdminReportsPage() {
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
        issue instanceof Error ? issue.message : 'Unable to load reports.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  return (
    <MainLayout>
      <PageHeader title="Admin · Audit and Reports">
        <Button variant="secondary" onClick={() => void loadReports()}>
          Refresh
        </Button>
      </PageHeader>

      <p className="document-meta">
        Global metrics and latest activity feed across all programs.
      </p>
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="document-meta">Loading reports...</p>}

      {!loading && (
        <>
          <div className="overview-grid">
            {reports.byStatus.map((item) => (
              <div className="overview-card" key={`status-${item.status}`}>
                <span className="overview-label">Status {item.status}</span>
                <span className="overview-value">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="table-panel" style={{ marginTop: '16px' }}>
            <div className="documents-table-wrap">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Type</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Responsible</th>
                    <th>Created By</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.latest.map((item) => (
                    <tr key={item.id}>
                      <td>{item.folio}</td>
                      <td>{item.type}</td>
                      <td>{item.program}</td>
                      <td>{item.status}</td>
                      <td>{item.responsible}</td>
                      <td>{item.createdBy}</td>
                      <td>{item.created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
