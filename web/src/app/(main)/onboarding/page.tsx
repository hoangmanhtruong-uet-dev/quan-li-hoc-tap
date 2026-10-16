'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          router.replace('/login');
        } else if (data.user.onboardingCompleted) {
          router.replace('/dashboard');
        }
        setChecking(false);
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: form.get('fullName') as string,
      displayName: form.get('displayName') as string,
      school: form.get('school') as string || undefined,
      major: form.get('major') as string || undefined,
      academicYear: form.get('academicYear') as string || undefined,
      careerGoal: form.get('careerGoal') as string || undefined,
    };

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Something went wrong');
    }
    setLoading(false);
  }

  if (checking) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome to CampusOS</CardTitle>
          <CardDescription>Complete your profile to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name <span className="text-destructive">*</span>
              </label>
              <Input id="fullName" name="fullName" placeholder="Nguyen Van A" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                Display name <span className="text-destructive">*</span>
              </label>
              <Input id="displayName" name="displayName" placeholder="nguyenva" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="school" className="text-sm font-medium">School</label>
              <Input id="school" name="school" placeholder="University of..." />
            </div>
            <div className="space-y-2">
              <label htmlFor="major" className="text-sm font-medium">Major</label>
              <Input id="major" name="major" placeholder="Computer Science" />
            </div>
            <div className="space-y-2">
              <label htmlFor="academicYear" className="text-sm font-medium">Academic year</label>
              <Input id="academicYear" name="academicYear" placeholder="1st year / Freshman" />
            </div>
            <div className="space-y-2">
              <label htmlFor="careerGoal" className="text-sm font-medium">Career goal (optional)</label>
              <Input id="careerGoal" name="careerGoal" placeholder="e.g. Full-stack developer" />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete setup'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}