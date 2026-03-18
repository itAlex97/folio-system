interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger';
  disabled?: boolean;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: Props) {
  const className = variant === 'danger' ? 'btn-danger' : 'btn-primary';
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
