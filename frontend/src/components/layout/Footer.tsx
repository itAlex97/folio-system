export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <span>Lear Corporation — Engineering Document Registry System</span>

      <span>Created by Alexis Gutierrez | v0.1 | {year}</span>
    </footer>
  );
}
