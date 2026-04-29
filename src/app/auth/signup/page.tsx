import Link from "next/link";
import { signUp } from "../actions";

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-forest-green mb-2 text-center">
          Create Account
        </h1>
        <p className="text-center text-ink/50 text-sm mb-6">
          Start learning the birds you&apos;ve found.
        </p>

        {error && (
          <div className="bg-danger/10 text-danger text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form action={signUp} className="flex flex-col gap-3">
          <input
            name="displayName"
            type="text"
            placeholder="Display name"
            required
            className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          />
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
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green/30"
          />
          <button
            type="submit"
            className="w-full bg-forest-green text-white font-medium py-3 rounded-xl hover:bg-forest-green/90 transition-colors"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-forest-green font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
