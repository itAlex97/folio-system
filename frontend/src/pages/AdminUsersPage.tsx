import { useEffect, useState, type FormEvent } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import {
  getAdminCatalogs,
  getAdminUsers,
  updateAdminUser,
} from '../services/adminService';
import type { AdminUser, CatalogProgram } from '../types/admin';

const ROLE_OPTIONS = ['LEADER', 'ENGINEER', 'DRAFTER'];

interface EditUserModalProps {
  user: AdminUser;
  programs: CatalogProgram[];
  loading: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (values: {
    name: string;
    role: string;
    isAdmin: boolean;
    programCode: string;
    isActive: boolean;
  }) => void;
}

function EditUserModal({
  user,
  programs,
  loading,
  error,
  onCancel,
  onSubmit,
}: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role.toUpperCase());
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [programCode, setProgramCode] = useState(user.programCode);
  const [isActive, setIsActive] = useState(user.isActive);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      name: name.trim(),
      role,
      isAdmin,
      programCode,
      isActive,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <h2 className="modal-title">Edit User</h2>
        <p className="modal-message">{user.username}</p>

        <form className="admin-edit-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-field">
            <label>Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              disabled={loading}
              required
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

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

          <label className="form-check">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(event) => setIsAdmin(event.target.checked)}
              disabled={loading}
            />
            System administrator
          </label>

          <label className="form-check">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={loading}
            />
            Active user
          </label>

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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [programs, setPrograms] = useState<CatalogProgram[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [flash, setFlash] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      const [nextUsers, nextCatalogs] = await Promise.all([
        getAdminUsers(),
        getAdminCatalogs(),
      ]);
      setUsers(nextUsers);
      setPrograms(nextCatalogs.programs);
      setError('');
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Unable to load users.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleUpdateUser(values: {
    name: string;
    role: string;
    isAdmin: boolean;
    programCode: string;
    isActive: boolean;
  }) {
    if (!editingUser) return;

    try {
      setIsSaving(true);
      setEditError('');
      await updateAdminUser(editingUser.id, values);
      setFlash(`User ${editingUser.username} updated.`);
      setEditingUser(null);
      await loadUsers();
    } catch (issue) {
      setEditError(
        issue instanceof Error ? issue.message : 'Unable to update user.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MainLayout>
      <PageHeader title="Admin - Users">
        <Button variant="secondary" onClick={() => void loadUsers()}>
          Refresh
        </Button>
      </PageHeader>

      <p className="document-meta">
        Manage users, role assignment, active status and program scope.
      </p>
      {flash && <p className="document-meta">{flash}</p>}
      {error && <p className="form-error">{error}</p>}
      {loading && <p className="document-meta">Loading users...</p>}

      {!loading && (
        <div className="table-panel">
          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Admin</th>
                  <th>Program</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>{user.isAdmin ? 'YES' : 'NO'}</td>
                    <td>{user.programCode}</td>
                    <td>{user.isActive ? 'YES' : 'NO'}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => {
                          setEditError('');
                          setEditingUser(user);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          programs={programs}
          loading={isSaving}
          error={editError}
          onCancel={() => {
            if (!isSaving) {
              setEditingUser(null);
              setEditError('');
            }
          }}
          onSubmit={(values) => void handleUpdateUser(values)}
        />
      )}
    </MainLayout>
  );
}
