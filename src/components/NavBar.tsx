"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavBarProps = {
  user: { displayName: string; streak: number } | null;
};

const authenticatedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/life-list", label: "Life List" },
  { href: "/profile", label: "Profile" },
];

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 bg-warm-white/80 backdrop-blur-sm border-b border-ink/5">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="font-bold text-forest-green">
          Better Birder
        </Link>

        <div className="flex items-center gap-1">
          {authenticatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-forest-green/10 text-forest-green font-medium"
                  : "text-ink/50 hover:text-ink hover:bg-ink/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {user.streak > 0 && (
            <span className="text-amber font-medium" title="Current streak">
              {user.streak}d
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
