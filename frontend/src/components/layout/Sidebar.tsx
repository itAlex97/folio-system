import { NavLink } from 'react-router-dom';

export default function Sidebar() {
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
      </nav>
    </aside>
  );
}
