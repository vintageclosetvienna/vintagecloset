import Link from 'next/link';

export const metadata = { title: 'Team | Vintage Closet', robots: { index: false, follow: false } };

// Placeholder until the staff app ships
export default function StaffPlaceholder() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="max-w-sm text-center space-y-3">
        <p className="text-2xl">🧥✨</p>
        <h1 className="text-lg font-semibold">Die Team-App kommt in Kürze</h1>
        <p className="text-sm text-muted">Dein Konto ist eingerichtet. Bitte frag den Shop-Manager nach dem Start.</p>
        <Link href="/" className="inline-block text-sm underline">Zum Shop</Link>
      </div>
    </main>
  );
}
