import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const programCode = user?.programCode ?? 'N/A';
  const userName = user?.name ?? 'Unknown User';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar-left">Lear Engineering Document Registry</div>

      <div className="topbar-right">
        <span className="program-badge">{programCode}</span>

        <span className="user-name">{userName}</span>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
