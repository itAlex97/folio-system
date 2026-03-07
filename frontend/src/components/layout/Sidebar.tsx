import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Folio System</div>

      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-item">
          Dashboard
        </NavLink>

        <NavLink to="/documents" className="nav-item">
          Documents
        </NavLink>
      </nav>
    </aside>
  );
}
