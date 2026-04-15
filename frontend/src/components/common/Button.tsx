interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'secondary' | 'success';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type,
  form,
}: Props) {
  const className =
    variant === 'danger'
      ? 'btn-danger'
      : variant === 'success'
        ? 'btn-success'
        : variant === 'secondary'
          ? 'btn-secondary'
          : 'btn-primary';

  return (
    <button
      type={type}
      form={form}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
