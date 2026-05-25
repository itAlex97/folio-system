import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import {
  createDocumentType,
  createFamily,
  createProgram,
  getAdminCatalogs,
  updateDocumentType,
  updateFamily,
  updateProgram,
} from '../services/adminService';
import type {
  AdminCatalogsResponse,
  CatalogDocumentType,
  CatalogFamily,
  CatalogProgram,
} from '../types/admin';

type CatalogView = 'programs' | 'documentTypes' | 'families';
type CatalogModalState =
  | { mode: 'create'; kind: 'program' }
  | { mode: 'edit'; kind: 'program'; item: CatalogProgram }
  | { mode: 'create'; kind: 'documentType' }
  | { mode: 'edit'; kind: 'documentType'; item: CatalogDocumentType }
  | { mode: 'create'; kind: 'family' }
  | { mode: 'edit'; kind: 'family'; item: CatalogFamily };

const EMPTY_CATALOGS: AdminCatalogsResponse = {
  programs: [],
  documentTypes: [],
  families: [],
};

const CATALOG_CARDS: Array<{
  key: CatalogView;
  label: string;
  getCount: (catalogs: AdminCatalogsResponse) => number;
}> = [
  {
    key: 'programs',
    label: 'Programs',
    getCount: (catalogs) => catalogs.programs.length,
  },
  {
    key: 'documentTypes',
    label: 'Document Types',
    getCount: (catalogs) => catalogs.documentTypes.length,
  },
  {
    key: 'families',
    label: 'Families',
    getCount: (catalogs) => catalogs.families.length,
  },
];

interface EditCatalogModalProps {
  editable: CatalogModalState;
  programs: CatalogProgram[];
  loading: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (values: {
    code?: string;
    name: string;
    programCode?: string;
  }) => void;
}

function EditCatalogModal({
  editable,
  programs,
  loading,
  error,
  onCancel,
  onSubmit,
}: EditCatalogModalProps) {
  const initialCode =
    editable.kind === 'family' || editable.mode === 'create'
      ? ''
      : editable.item.code.toUpperCase();
  const initialName = editable.mode === 'create' ? '' : (editable.item.name ?? '');
  const initialProgramCode =
    editable.kind === 'family'
      ? editable.mode === 'create'
        ? (programs[0]?.code ?? '')
        : editable.item.programCode
      : '';

  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(initialName);
  const [programCode, setProgramCode] = useState(initialProgramCode);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      code: editable.kind === 'family' ? undefined : code.trim().toUpperCase(),
      name: name.trim(),
      programCode:
        editable.kind === 'family'
          ? programCode.trim().toUpperCase()
          : undefined,
    });
  }

  const title =
    editable.mode === 'create'
      ? editable.kind === 'program'
        ? 'Add Program'
        : editable.kind === 'documentType'
          ? 'Add Document Type'
          : 'Add Family'
      : editable.kind === 'program'
        ? 'Edit Program'
        : editable.kind === 'documentType'
          ? 'Edit Document Type'
          : 'Edit Family';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">{title}</h2>

        <form className="admin-edit-form" onSubmit={handleSubmit}>
          {editable.kind !== 'family' && (
            <div className="form-field">
              <label>Code</label>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          {editable.kind === 'family' && (
            <div className="form-field">
              <label>Program</label>
              <select
                value={programCode}
                onChange={(event) => setProgramCode(event.target.value)}
                disabled={loading}
                required
              >
                {programs.map((program) => (
                  <option key={program.code} value={program.code}>
                    {program.code}
                    {program.name ? ` - ${program.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              required={editable.kind === 'family'}
            />
          </div>

          {error && <span className="form-error">{error}</span>}

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {editable.mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCatalogsPage() {
  const [catalogs, setCatalogs] =
    useState<AdminCatalogsResponse>(EMPTY_CATALOGS);
  const [selectedView, setSelectedView] = useState<CatalogView>('programs');
  const [catalogModal, setCatalogModal] = useState<CatalogModalState | null>(
    null,
  );
  const [familyProgramFilter, setFamilyProgramFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
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

  async function handleUpdateCatalog(values: {
    code?: string;
    name: string;
    programCode?: string;
  }) {
    if (!catalogModal) return;

    try {
      setIsSaving(true);
      setEditError('');

      if (catalogModal.kind === 'program') {
        const payload = {
          code: values.code ?? '',
          name: values.name,
        };

        if (catalogModal.mode === 'create') {
          await createProgram(payload);
          setFlash(`Program ${values.code} created.`);
        } else {
          await updateProgram(catalogModal.item.code, payload);
          setFlash(`Program ${values.code} updated.`);
        }
      }

      if (catalogModal.kind === 'documentType') {
        const payload = {
          code: values.code ?? '',
          name: values.name,
        };

        if (catalogModal.mode === 'create') {
          await createDocumentType(payload);
          setFlash(`Document type ${values.code} created.`);
        } else {
          await updateDocumentType(catalogModal.item.code, payload);
          setFlash(`Document type ${values.code} updated.`);
        }
      }

      if (catalogModal.kind === 'family') {
        const payload = {
          programCode: values.programCode ?? '',
          name: values.name,
        };

        if (catalogModal.mode === 'create') {
          await createFamily(payload);
          setFlash(`Family ${values.name} created.`);
        } else {
          await updateFamily(catalogModal.item.id, payload);
          setFlash(`Family ${values.name} updated.`);
        }
      }

      setCatalogModal(null);
      await loadCatalogs();
    } catch (issue) {
      setEditError(
        issue instanceof Error ? issue.message : 'Unable to update catalog.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function renderTable() {
    if (selectedView === 'programs') {
      return (
        <CatalogTable headers={['Code', 'Name', 'Actions']}>
          {catalogs.programs.map((program) => (
            <tr key={program.code}>
              <td>{program.code}</td>
              <td>{program.name || '-'}</td>
              <td>
                <button
                  type="button"
                  className="table-action"
                  onClick={() => {
                    setEditError('');
                    setCatalogModal({
                      mode: 'edit',
                      kind: 'program',
                      item: program,
                    });
                  }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </CatalogTable>
      );
    }

    if (selectedView === 'documentTypes') {
      return (
        <CatalogTable headers={['Code', 'Name', 'Actions']}>
          {catalogs.documentTypes.map((documentType) => (
            <tr key={documentType.code}>
              <td>{documentType.code}</td>
              <td>{documentType.name || '-'}</td>
              <td>
                <button
                  type="button"
                  className="table-action"
                  onClick={() => {
                    setEditError('');
                    setCatalogModal({
                      mode: 'edit',
                      kind: 'documentType',
                      item: documentType,
                    });
                  }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </CatalogTable>
      );
    }

    const filteredFamilies = familyProgramFilter
      ? catalogs.families.filter(
          (family) => family.programCode === familyProgramFilter,
        )
      : catalogs.families;

    return (
      <CatalogTable
        headers={[
          'Family',
          <div className="catalog-header-filter" key="program-filter">
            <span>Program</span>
            <select
              value={familyProgramFilter}
              onChange={(event) => setFamilyProgramFilter(event.target.value)}
            >
              <option value="">All</option>
              {catalogs.programs.map((program) => (
                <option key={program.code} value={program.code}>
                  {program.code}
                </option>
              ))}
            </select>
          </div>,
          'Actions',
        ]}
      >
        {filteredFamilies.map((family) => (
          <tr key={family.id}>
            <td>{family.name}</td>
            <td>{family.programCode}</td>
            <td>
              <button
                type="button"
                className="table-action"
                onClick={() => {
                  setEditError('');
                  setCatalogModal({
                    mode: 'edit',
                    kind: 'family',
                    item: family,
                  });
                }}
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </CatalogTable>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="Admin - Catalogs">
        <Button variant="secondary" onClick={() => void loadCatalogs()}>
          Refresh
        </Button>
      </PageHeader>

      <p className="document-meta">
        Select a catalog to review and edit its records.
      </p>
      {flash && <p className="document-meta">{flash}</p>}
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="document-meta">Loading catalogs...</p>}

      {!loading && (
        <>
          <div className="overview-grid">
            {CATALOG_CARDS.map((card) => (
              <button
                type="button"
                className={`overview-card catalog-card ${
                  selectedView === card.key ? 'active' : ''
                }`}
                key={card.key}
                onClick={() => setSelectedView(card.key)}
              >
                <span className="overview-label">{card.label}</span>
                <span className="overview-value">
                  {card.getCount(catalogs)}
                </span>
              </button>
            ))}
          </div>

          <div className="catalog-table-section">
            <div className="table-actions-section">
              <span className="document-meta">
                {selectedView === 'programs'
                  ? 'Programs'
                  : selectedView === 'documentTypes'
                    ? 'Document Types'
                    : 'Families'}
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditError('');
                  setCatalogModal({
                    mode: 'create',
                    kind:
                      selectedView === 'programs'
                        ? 'program'
                        : selectedView === 'documentTypes'
                          ? 'documentType'
                          : 'family',
                  });
                }}
              >
                {selectedView === 'programs'
                  ? 'Add Program'
                  : selectedView === 'documentTypes'
                    ? 'Add Document Type'
                    : 'Add Family'}
              </Button>
            </div>
            {renderTable()}
          </div>
        </>
      )}

      {catalogModal && (
        <EditCatalogModal
          editable={catalogModal}
          programs={catalogs.programs}
          loading={isSaving}
          error={editError}
          onCancel={() => {
            if (!isSaving) {
              setCatalogModal(null);
              setEditError('');
            }
          }}
          onSubmit={(values) => void handleUpdateCatalog(values)}
        />
      )}
    </MainLayout>
  );
}

function CatalogTable({
  headers,
  children,
}: {
  headers: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="table-panel">
      <div className="documents-table-wrap">
        <table className="documents-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`catalog-header-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
