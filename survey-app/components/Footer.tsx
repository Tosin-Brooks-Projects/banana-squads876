import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto text-center text-sm text-neutral-500">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/about"
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            About
          </Link>
          <span className="text-neutral-300">·</span>
          <Link
            href="/pricing"
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Pricing
          </Link>
          <span className="text-neutral-300">·</span>
          <Link
            href="/terms"
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Terms
          </Link>
          <span className="text-neutral-300">·</span>
          <Link
            href="/privacy"
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Privacy
          </Link>
        </div>
        <p className="mt-4">
          © 2026 Unboring Surveys · Made with{' '}
          <span className="text-red-500">♥</span> by{' '}
          <Link
            href="https://x.com/brooksconkle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 hover:text-brand-600 transition-colors"
          >
            @brooksconkle
          </Link>
        </p>
      </div>
    </footer>
  );
}
