import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronUp, ChevronDown, Eye, FilterX } from 'lucide-react';
import DocumentStatusBadge from './DocumentStatusBadge';
import { useAuth } from '../../auth/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import type { DocumentType } from '../../types/document';

interface Props {
  type?: DocumentType;
}

export default function DocumentsTable({ type }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const normalizedRole = user?.role?.toUpperCase() ?? '';
  const isAdmin = normalizedRole === 'ADMIN';
  const userProgramCode = user?.programCode ?? '';

  const { documents, loading, error } = useDocuments({
    type,
    program: isAdmin
      ? searchParams.get('program') || undefined
      : userProgramCode || undefined,
  });

  const search = searchParams.get('search') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const programFilter = isAdmin
    ? (searchParams.get('program') ?? '')
    : userProgramCode;
  const modelYearFilter = searchParams.get('modelYear') ?? '';
  const phaseFilter = searchParams.get('phase') ?? '';
  const sortField = searchParams.get('sort') ?? '';
  const sortDirection =
    searchParams.get('direction') === 'desc' ? 'desc' : 'asc';

  function updateParams(nextValues: Record<string, string>) {
    const nextParams = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(nextValues)) {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    }

    setSearchParams(nextParams);
  }

  function handleSort(field: string) {
    if (sortField === field) {
      updateParams({
        sort: field,
        direction: sortDirection === 'asc' ? 'desc' : 'asc',
      });
    } else {
      updateParams({
        sort: field,
        direction: 'asc',
      });
    }
  }

  if (loading) {
    return <div className="loading-state">Loading documents...</div>;
  }

  if (error) {
    return (
      <div className="loading-state">Unable to load documents: {error}</div>
    );
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.folio
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || doc.status === statusFilter;
    const matchesProgram = isAdmin
      ? programFilter === '' || doc.program === programFilter
      : doc.program === userProgramCode;
    const matchesModelYear =
      modelYearFilter === '' ||
      (doc.modelYear ?? '')
        .toLowerCase()
        .includes(modelYearFilter.toLowerCase());
    const matchesPhase =
      phaseFilter === '' ||
      (doc.phase ?? '').toLowerCase().includes(phaseFilter.toLowerCase());

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProgram &&
      matchesModelYear &&
      matchesPhase
    );
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = String(a[sortField as keyof typeof a] ?? '');
    const bValue = String(b[sortField as keyof typeof b] ?? '');

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;

    return 0;
  });

  function renderSortIcon(field: string) {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <ChevronUp size={16} className="sort-icon" />
    ) : (
      <ChevronDown size={16} className="sort-icon" />
    );
  }

  const programOptions = Array.from(
    new Set(documents.map((doc) => doc.program)),
  )
    .filter((program) => program)
    .sort((a, b) => a.localeCompare(b));

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(statusFilter) ||
    (isAdmin && Boolean(programFilter)) ||
    Boolean(modelYearFilter) ||
    Boolean(phaseFilter);

  return (
    <div className="table-panel">
      <div
        className={`table-filters ${isAdmin ? 'table-filters-admin' : 'table-filters-user'}`}
      >
        <input
          type="text"
          placeholder="Search by folio"
          value={search}
          onChange={(e) => updateParams({ search: e.target.value })}
        />

        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        {isAdmin && (
          <select
            value={programFilter}
            onChange={(e) => updateParams({ program: e.target.value })}
          >
            <option value="">All Programs</option>
            {programOptions.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Model year"
          value={modelYearFilter}
          onChange={(e) => updateParams({ modelYear: e.target.value })}
        />

        <input
          type="text"
          placeholder="Phase"
          value={phaseFilter}
          onChange={(e) => updateParams({ phase: e.target.value })}
        />

        {hasActiveFilters && (
          <button
            type="button"
            className="table-action table-filter-clear-icon"
            title="Clear filters"
            aria-label="Clear filters"
            onClick={() =>
              updateParams({
                search: '',
                status: '',
                program: '',
                modelYear: '',
                phase: '',
              })
            }
          >
            <FilterX size={16} />
          </button>
        )}
      </div>

      <div className="document-actions">
        <p className="document-meta">
          Showing {sortedDocuments.length} of {documents.length} documents
          {type ? ` in ${type}` : ''}.
        </p>
      </div>

      <div className="documents-table-wrap">
        <table className="documents-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('folio')}>
                Folio{renderSortIcon('folio')}
              </th>

              <th className="sortable" onClick={() => handleSort('type')}>
                Type{renderSortIcon('type')}
              </th>

              <th className="sortable" onClick={() => handleSort('program')}>
                Program{renderSortIcon('program')}
              </th>

              <th className="sortable" onClick={() => handleSort('modelYear')}>
                Model Year{renderSortIcon('modelYear')}
              </th>

              <th className="sortable" onClick={() => handleSort('phase')}>
                Phase{renderSortIcon('phase')}
              </th>

              <th>Family</th>

              <th>Responsible</th>

              <th className="sortable" onClick={() => handleSort('status')}>
                Status{renderSortIcon('status')}
              </th>

              <th className="sortable" onClick={() => handleSort('created')}>
                Created{renderSortIcon('created')}
              </th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedDocuments.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-results">
                  No documents found. Adjust the filters or clear them to see
                  all documents again.
                </td>
              </tr>
            ) : (
              sortedDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.folio}</td>
                  <td>{doc.type}</td>
                  <td>{doc.program}</td>
                  <td>{doc.modelYear ?? '-'}</td>
                  <td>{doc.phase ?? '-'}</td>
                  <td>{doc.family}</td>
                  <td>{doc.responsible}</td>

                  <td>
                    <DocumentStatusBadge status={doc.status} />
                  </td>

                  <td>{doc.created}</td>

                  <td>
                    <button
                      type="button"
                      className="table-action"
                      onClick={() =>
                        navigate(`/documents/${doc.id}`, {
                          state: {
                            returnTo: `${location.pathname}${location.search}`,
                            sourceLabel: type
                              ? `${type} Documents`
                              : 'Documents',
                          },
                        })
                      }
                    >
                      <Eye size={16} className="table-action-icon" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
