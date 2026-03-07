import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';

interface Props {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Props) {
  return (
    <div className="app-container">
      <Topbar />

      <div className="main-area">
        <Sidebar />

        <main className="content">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
