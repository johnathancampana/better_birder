import Link from "next/link";
import { signIn } from "../actions";

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
