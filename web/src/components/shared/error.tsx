'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function Error({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center fade-in', className)}>
      <div className="mb-4 text-destructive">
        <AlertTriangle className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
      )}
    </div>
  );
}