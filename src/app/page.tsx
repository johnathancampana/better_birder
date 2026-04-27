export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-forest-green mb-3">
          Better Birder
        </h1>
        <p className="text-lg text-ink/70 mb-8">
          Learn the birds you&apos;ve found. Duolingo-style quizzes built from
          your life list.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/auth/signup"
            className="inline-block bg-forest-green text-white font-medium py-3 px-6 rounded-xl hover:bg-forest-green/90 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/auth/signin"
            className="inline-block text-forest-green font-medium py-3 px-6 rounded-xl border border-forest-green/20 hover:bg-forest-green/5 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}
