import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { getAdminUsers, updateAdminUser } from '../services/adminService';
import type { AdminUser } from '../types/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      const next = await getAdminUsers();
      setUsers(next);
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

  async function handleQuickUpdate(user: AdminUser) {
    const nextRole = window
      .prompt('Role (ADMIN, LEADER, ENGINEER, DRAFTER):', user.role)
      ?.trim();
    if (!nextRole) return;

    const nextProgramCode = window
      .prompt('Program code:', user.programCode)
      ?.trim();
    if (!nextProgramCode) return;

    const keepActive = window.confirm(
      'Keep user active? Click Cancel to deactivate.',
    );

    try {
      await updateAdminUser(user.id, {
        name: user.name,
        role: nextRole,
        programCode: nextProgramCode,
        isActive: keepActive,
      });
      setFlash(`User ${user.username} updated.`);
      await loadUsers();
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : 'Unable to update user.',
      );
    }
  }

  return (
    <MainLayout>
      <PageHeader title="Admin · Users">
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
                    <td>{user.programCode}</td>
                    <td>{user.isActive ? 'YES' : 'NO'}</td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => void handleQuickUpdate(user)}
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
    </MainLayout>
  );
}
