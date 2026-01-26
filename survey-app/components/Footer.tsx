import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto text-center text-sm text-neutral-500">
        <p>
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
