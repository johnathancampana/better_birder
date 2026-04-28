import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Welcome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Session is active — email confirmation is off, or user confirmed already
  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-forest-green/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-forest-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-forest-green">You&apos;re all set!</h1>
            <p className="text-ink/50 text-sm mt-2">
              Your account has been created. Let&apos;s get you started.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="w-full bg-forest-green text-white font-medium py-3 rounded-xl hover:bg-forest-green/90 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </main>
    );
  }

  // No session — email confirmation is required
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-amber/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Check your email</h1>
          <p className="text-ink/50 text-sm mt-2">
            We sent you a confirmation link. Click it to activate your account,
            then sign in to get started.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="w-full bg-forest-green text-white font-medium py-3 rounded-xl hover:bg-forest-green/90 transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    </main>
  );
}
