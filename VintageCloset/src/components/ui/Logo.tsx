import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`font-display font-bold text-xl tracking-tight text-ink ${className}`}>
      VINTAGE<span className="text-accent-start">.</span>
    </Link>
  );
}


