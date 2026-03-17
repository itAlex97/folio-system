import DocumentStatusBadge from './DocumentStatusBadge';
import { useNavigate } from 'react-router-dom';

interface Document {
  id: number;
  folio: string;
  type: string;
  program: string;
  family: string;
  responsible: string;
  status: string;
  created: string;
}

const mockDocuments: Document[] = [
  {
    id: 1,
    folio: 'Y2XX-26-BCN-0001',
    type: 'BCN',
    program: 'Y2XX',
    family: 'ENGINE',
    responsible: 'Juan Perez',
    status: 'OPEN',
    created: '2026-03-03',
  },
  {
    id: 2,
    folio: 'Y2XX-26-DCN-0003',
    type: 'DCN',
    program: 'Y2XX',
    family: 'BODY',
    responsible: 'Ana Lopez',
    status: 'CLOSED',
    created: '2026-03-02',
  },
];

export default function DocumentsTable() {
  const navigate = useNavigate();

  return (
    <table className="documents-table">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Type</th>
          <th>Program</th>
          <th>Family</th>
          <th>Responsible</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {mockDocuments.map((doc) => (
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
        ))}
      </tbody>
    </table>
  );
}
