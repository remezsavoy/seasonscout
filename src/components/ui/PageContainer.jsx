import { cn } from '../../lib/cn';

export function PageContainer({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8', className)}>{children}</div>;
}
