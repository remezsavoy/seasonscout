import { cn } from '../../lib/cn';

export function buttonVariants({ variant = 'primary', size = 'md' } = {}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lagoon/35 disabled:pointer-events-none disabled:opacity-60';

  const variantStyles = {
    primary: 'bg-ink text-white shadow-lg shadow-ink/10 hover:bg-ink/90',
    secondary: 'bg-white text-ink ring-1 ring-ink/10 hover:bg-white/80',
    ghost: 'bg-transparent text-ink hover:bg-ink/5',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  return cn(baseStyles, variantStyles[variant], sizeStyles[size]);
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) {
  return <button className={cn(buttonVariants({ variant, size }), className)} type={type} {...props} />;
}
