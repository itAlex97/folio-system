interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: Props) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>

      <div className="page-actions">{children}</div>
    </div>
  );
}
