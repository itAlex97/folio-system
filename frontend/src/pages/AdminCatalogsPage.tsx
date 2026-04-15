import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import {
  createDocumentType,
  createFamily,
  createProgram,
  getAdminCatalogs,
} from '../services/adminService';
import type { AdminCatalogsResponse } from '../types/admin';

const EMPTY_CATALOGS: AdminCatalogsResponse = {
  programs: [],
  documentTypes: [],
  families: [],
};

export default function AdminCatalogsPage() {
  const [catalogs, setCatalogs] =
    useState<AdminCatalogsResponse>(EMPTY_CATALOGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  async function loadCatalogs() {
    try {
      setLoading(true);
      const next = await getAdminCatalogs();
      setCatalogs(next);
      setError('');
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Unable to load catalogs.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCatalogs();
  }, []);

  async function handleCreateProgram() {
    const code = window
      .prompt('Program code (example Y3XX):')
      ?.trim()
      .toUpperCase();
    if (!code) return;

    const name = window.prompt('Program name (optional):')?.trim() ?? '';

    try {
      await createProgram({ code, name });
      setFlash(`Program ${code} created.`);
      await loadCatalogs();
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Unable to create program.',
      );
    }
  }

  async function handleCreateDocumentType() {
    const code = window
      .prompt('Document type code (example ECN):')
      ?.trim()
      .toUpperCase();
    if (!code) return;

    const name = window.prompt('Document type name (optional):')?.trim() ?? '';

    try {
      await createDocumentType({ code, name });
      setFlash(`Document type ${code} created.`);
      await loadCatalogs();
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : 'Unable to create document type.',
      );
    }
  }

  async function handleCreateFamily() {
    const programCode = window
      .prompt('Program code for the family:')
      ?.trim()
      .toUpperCase();
    if (!programCode) return;

    const name = window.prompt('Family name:')?.trim();
    if (!name) return;

    try {
      await createFamily({ programCode, name });
      setFlash(`Family ${name} created for ${programCode}.`);
      await loadCatalogs();
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Unable to create family.',
      );
    }
  }

  return (
    <MainLayout>
      <PageHeader title="Admin · Catalogs">
        <Button variant="secondary" onClick={() => void loadCatalogs()}>
          Refresh
        </Button>
        <Button variant="secondary" onClick={() => void handleCreateProgram()}>
          Add Program
        </Button>
        <Button
          variant="secondary"
          onClick={() => void handleCreateDocumentType()}
        >
          Add Doc Type
        </Button>
        <Button variant="secondary" onClick={() => void handleCreateFamily()}>
          Add Family
        </Button>
      </PageHeader>

      <p className="document-meta">
        Manage Programs, Document Types and Families.
      </p>
      {flash && <p className="document-meta">{flash}</p>}
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="document-meta">Loading catalogs...</p>}

      {!loading && (
        <div className="overview-grid">
          <div className="overview-card">
            <span className="overview-label">Programs</span>
            <span className="overview-value">{catalogs.programs.length}</span>
          </div>
          <div className="overview-card">
            <span className="overview-label">Document Types</span>
            <span className="overview-value">
              {catalogs.documentTypes.length}
            </span>
          </div>
          <div className="overview-card">
            <span className="overview-label">Families</span>
            <span className="overview-value">{catalogs.families.length}</span>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
