import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/LoginPage';
import DocumentDetailPage from '../pages/DocumentDetailPage';
import CreateDocumentPage from '../pages/CreateDocumentPage';
import DocumentsOverviewPage from '../pages/DocumentsOverviewPage';
import DocumentsTypePage from '../pages/DocumentsTypePage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/documents" element={<DocumentsOverviewPage />} />
        <Route path="/documents/new" element={<CreateDocumentPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/documents/bcn" element={<DocumentsTypePage type="BCN" />} />
        <Route path="/documents/dcn" element={<DocumentsTypePage type="DCN" />} />
        <Route path="/documents/dfm" element={<DocumentsTypePage type="DFM" />} />
      </Routes>
    </BrowserRouter>
  );
}
