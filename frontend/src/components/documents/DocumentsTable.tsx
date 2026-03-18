import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DocumentStatusBadge from './DocumentStatusBadge';
import { useDocuments } from '../../hooks/useDocuments';

export default function DocumentsTable() {
  const navigate = useNavigate();

  const { documents, loading } = useDocuments();

  // SORT STATE
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  // Loading state
  if (loading) {
    return <p>Loading documents...</p>;
  }

  // Filtering logic
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.folio
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = statusFilter === '' || doc.status === statusFilter;

    const matchesProgram =
      programFilter === '' || doc.program === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;

    return 0;
  });

  function renderSortIcon(field: string) {
    if (sortField !== field) return '';

    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <div>
      {/* Filters */}
      <div className="table-filters">
        <input
          type="text"
          placeholder="Search by folio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
        >
          <option value="">All Programs</option>
          <option value="Y2XX">Y2XX</option>
          <option value="31XX">31XX</option>
        </select>
      </div>

      {/* Table */}
      <table className="documents-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('folio')}>
              Folio{renderSortIcon('folio')}
            </th>

            <th onClick={() => handleSort('type')}>
              Type{renderSortIcon('type')}
            </th>

            <th onClick={() => handleSort('program')}>
              Program{renderSortIcon('program')}
            </th>

            <th>Family</th>

            <th>Responsible</th>

            <th onClick={() => handleSort('status')}>
              Status{renderSortIcon('status')}
            </th>

            <th onClick={() => handleSort('created')}>
              Created{renderSortIcon('created')}
            </th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {sortedDocuments.length === 0 ? (
            <tr>
              <td colSpan={8} className="no-results">
                No documents found
              </td>
            </tr>
          ) : (
            sortedDocuments.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.folio}</td>
                <td>{doc.type}</td>
                <td>{doc.program}</td>
                <td>{doc.family}</td>
                <td>{doc.responsible}</td>

                <td>
                  <DocumentStatusBadge status={doc.status} />
                </td>

                <td>{doc.created}</td>

                <td>
                  <button
                    className="table-action"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
