import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="tnum text-4xl font-bold text-fg-subtle">404</p>
      <h1 className="text-2xl font-semibold text-fg">Page not found</h1>
      <p className="max-w-sm text-sm text-fg-muted">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="text-sm font-medium text-brand hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
