import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = Boolean(user?.isAdmin);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isAdminOpen, setIsAdminOpen] = useState(isAdminRoute);

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
            <span className="sidebar-section-label">System</span>

            <NavLink
              to="/admin"
              end
              onClick={() => setIsAdminOpen((current) => !current)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span>Administracion</span>
              {isAdminOpen ? (
                <ChevronDown
                  size={16}
                  className="sidebar-chevron"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="sidebar-chevron"
                  aria-hidden="true"
                />
              )}
            </NavLink>

            {isAdminOpen && (
              <div className="sidebar-submenu">
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `sidebar-subitem ${isActive ? 'active' : ''}`
                  }
                >
                  Users
                </NavLink>

                <NavLink
                  to="/admin/catalogs"
                  className={({ isActive }) =>
                    `sidebar-subitem ${isActive ? 'active' : ''}`
                  }
                >
                  Catalogs
                </NavLink>

                <NavLink
                  to="/admin/reports"
                  className={({ isActive }) =>
                    `sidebar-subitem ${isActive ? 'active' : ''}`
                  }
                >
                  Audit and Reports
                </NavLink>
              </div>
            )}
          </>
        )}
      </nav>
    </aside>
  );
}
