import Link from "next/link";
import { signIn, signInWithGoogle } from "../actions";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-forest-green mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-center text-ink/50 text-sm mb-6">
          Sign in to your account.
        </p>

        {error && (
          <div className="bg-danger/10 text-danger text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form action={signIn} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          />
          <button
            type="submit"
            className="w-full bg-forest-green text-white font-medium py-3 rounded-xl hover:bg-forest-green/90 transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-warm-white px-2 text-ink/40">or</span>
          </div>
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 border border-ink/10 py-3 rounded-xl text-sm font-medium hover:bg-ink/5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-forest-green font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
