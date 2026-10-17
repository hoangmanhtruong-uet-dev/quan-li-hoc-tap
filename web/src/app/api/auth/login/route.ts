import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmail, setSession, signUpWithEmail } from '@/lib/auth';
import { DEMO_STUDENT_CREDENTIALS } from '@/lib/auth-validation';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    let { data, error } = await signInWithEmail(email, password);

    // If it's the canonical 1-Click Demo account and not yet present in Supabase Auth
    if (
      (error || !data?.user) &&
      email.trim() === DEMO_STUDENT_CREDENTIALS.email &&
      password === DEMO_STUDENT_CREDENTIALS.password
    ) {
      try {
        const signUpRes = await signUpWithEmail(email, password, DEMO_STUDENT_CREDENTIALS.fullName);
        if (signUpRes.data?.user) {
          const retry = await signInWithEmail(email, password);
          if (retry.data?.user) {
            data = retry.data;
            error = null;
          } else {
            data = {
              user: signUpRes.data.user as any,
              session: null as any,
            };
            error = null;
          }
        }
      } catch (seedErr) {
        console.error('Demo auto-seed error:', seedErr);
      }

      // Infallible fallback for demo user
      if (!data?.user) {
        data = {
          user: {
            id: 'demo_student_id',
            email: DEMO_STUDENT_CREDENTIALS.email,
            user_metadata: { full_name: DEMO_STUDENT_CREDENTIALS.fullName },
            role: 'student',
          } as any,
          session: null as any,
        };
        error = null;
      }
    }

    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = data.user;
    const role = (user as any).role || 'USER';

    await setSession({
      userId: user.id,
      email: user.email || email,
      role: role as any,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email || email,
        fullName: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Sinh viên'),
        role,
      },
      needsOnboarding: false,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}