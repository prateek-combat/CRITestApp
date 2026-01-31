import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-parchment py-12 text-ink sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-archive-wash absolute inset-0" />
        <div className="bg-archive-grid absolute inset-0 opacity-40" />
        <div className="noise-overlay absolute inset-0 opacity-20 mix-blend-multiply" />
      </div>
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-ink/10 bg-parchment/80 px-4 py-8 shadow sm:px-10">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-ink">404</h1>
            <h2 className="mt-2 text-3xl font-bold text-ink">Page Not Found</h2>
            <p className="mt-2 text-sm text-ink/60">
              The page you&apos;re looking for doesn&apos;t exist.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="flex w-full justify-center rounded-md border border-ink/80 bg-ink px-4 py-2 text-sm font-medium text-parchment shadow-sm hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-copper/40 focus:ring-offset-2"
              >
                Go back home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
