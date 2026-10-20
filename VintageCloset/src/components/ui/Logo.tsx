import Link from "next/link";
import Image from "next/image";

// Official Vintage Closet sticker logo (teal letters, plum outline) from the brand kit
// compact: smaller version for the scrolled header
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" aria-label="Vintage Closet home" className={`inline-flex items-center ${className ?? ''}`}>
      <Image
        src="/brand/vintage-closet-logo.png"
        alt="Vintage Closet"
        width={480}
        height={436}
        priority
        className={`w-auto drop-shadow-sm transition-all duration-300 ${compact ? 'h-10' : 'h-11 md:h-14'}`}
      />
    </Link>
  );
}
