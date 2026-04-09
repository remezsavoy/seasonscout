import { cn } from '../../lib/cn';

export function SkeletonBlock({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-[1.25rem] bg-ink/8', className)} />;
}
