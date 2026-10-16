import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Empty({
  title = 'No data',
  description = 'Nothing to show here yet.',
  icon,
  className,
  action,
}: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center fade-in', className)}>
      <div className="mb-4 text-muted-foreground">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
