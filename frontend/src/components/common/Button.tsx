interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger';
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
}: Props) {
  const className = variant === 'danger' ? 'btn-danger' : 'btn-primary';
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}
