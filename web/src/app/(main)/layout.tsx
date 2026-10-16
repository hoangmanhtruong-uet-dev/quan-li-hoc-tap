import { AppLayout } from '@/components/layout/app-layout';
import { requireUser } from '@/lib/authorization';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // Authentication is required here. The onboarding page performs its own
  // completion check, so the shared layout must not redirect it back to itself.
  await requireUser({ requireOnboarding: false });
  return <AppLayout>{children}</AppLayout>;
}
