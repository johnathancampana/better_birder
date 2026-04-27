import { signOut } from "@/app/auth/actions";

export default function Profile() {
  return (
    <main className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-forest-green mb-4">Profile</h1>
      <p className="text-ink/50 text-sm mb-8">
        User profile, badges, and settings coming soon.
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-danger font-medium hover:underline"
        >
          Sign Out
        </button>
      </form>
    </main>
  );
}
