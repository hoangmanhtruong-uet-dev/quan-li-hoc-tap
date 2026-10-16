'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  const status = searchParams.get('status');
  const reason = searchParams.get('error');

  useEffect(() => {
    if (status === 'success') {
      setSuccess('Email verified successfully! Redirecting...');
      setTimeout(() => router.push('/onboarding'), 2000);
    }
    if (reason === 'invalid_verification') {
      setError('This verification link is invalid or has expired. Request a new one below.');
    }
  }, [status, reason, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenInput }),
    });

    if (res.ok) {
      setSuccess('Email verified successfully! Redirecting...');
      setTimeout(() => router.push('/onboarding'), 2000);
    } else {
      const data = await res.json();
      setError(data.error || 'Verification failed');
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">C</div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email, or click the link in the email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{success}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-medium">Verification code</label>
            <Input
              id="token"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste verification code"
              required
            />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify email'}
          </Button>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => router.push('/login')}
          >
            Back to login
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}