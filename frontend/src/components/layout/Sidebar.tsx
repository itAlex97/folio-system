import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = (user?.role?.toUpperCase() ?? '') === 'ADMIN';

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Documents</span>

        <NavLink
          to="/documents"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Overview
        </NavLink>

        <NavLink
          to="/documents/bcn"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          BCN
        </NavLink>

        <NavLink
          to="/documents/dcn"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          DCN
        </NavLink>

        <NavLink
          to="/documents/dfm"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          DFM
        </NavLink>

        {isAdmin && (
          <>
            <span className="sidebar-section-label">Admin</span>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              Users
            </NavLink>

            <NavLink
              to="/admin/catalogs"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              Catalogs
            </NavLink>

            <NavLink
              to="/admin/reports"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              Audit and Reports
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
