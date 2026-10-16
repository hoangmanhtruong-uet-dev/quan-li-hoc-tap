import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'spinner' | 'skeleton';
  count?: number;
}

export function Loading({ className, size = 'md', text, variant = 'spinner', count = 3 }: LoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)} role="status">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - i * 15}%` }} />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-8', className)} role="status">
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loading size="lg" />
    </div>
  );
}
