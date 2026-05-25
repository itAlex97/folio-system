import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import LoginPage from '../pages/LoginPage';
import DocumentDetailPage from '../pages/DocumentDetailPage';
import CreateDocumentPage from '../pages/CreateDocumentPage';
import DocumentsOverviewPage from '../pages/DocumentsOverviewPage';
import DocumentsTypePage from '../pages/DocumentsTypePage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminCatalogsPage from '../pages/AdminCatalogsPage';
import AdminReportsPage from '../pages/AdminReportsPage';
import AdminHomePage from '../pages/AdminHomePage';

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function LoginRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/documents" replace />;
  }

  return <LoginPage />;
}

function RequireAdmin() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/documents" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/login" element={<LoginRoute />} />

        <Route element={<RequireAuth />}>
          <Route path="/documents" element={<DocumentsOverviewPage />} />
          <Route path="/documents/new" element={<CreateDocumentPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route
            path="/documents/bcn"
            element={<DocumentsTypePage type="BCN" />}
          />
          <Route
            path="/documents/dcn"
            element={<DocumentsTypePage type="DCN" />}
          />
          <Route
            path="/documents/dfm"
            element={<DocumentsTypePage type="DFM" />}
          />

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/catalogs" element={<AdminCatalogsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
