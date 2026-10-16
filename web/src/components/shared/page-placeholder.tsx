import { cn } from '@/lib/utils';

interface PagePlaceholderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PagePlaceholder({ title, description, children, className }: PagePlaceholderProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] space-y-6', className)}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-[-0.035em] md:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>}
      </div>
      {children}
    </div>
  );
}
