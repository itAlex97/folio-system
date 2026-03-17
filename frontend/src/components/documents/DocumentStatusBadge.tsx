interface Props {
  status: string;
}

export default function DocumentStatusBadge({ status }: Props) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}
