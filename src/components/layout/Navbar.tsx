"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Layers,
  LayoutDashboard,
  LogOut,
  User,
  ChevronDown,
  Swords,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <nav className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-gold/40 group-hover:bg-brand-gold/30 transition-colors">
            <Swords className="w-4 h-4 text-brand-gold" />
          </div>
          <span className="font-bold text-lg text-primary">
            Deck<span className="text-brand-gold">Forge</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {session &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "bg-bg-elevated text-primary"
                    : "text-secondary hover:text-primary hover:bg-bg-elevated"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-primary hover:border-border-strong hover:bg-bg-hover transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50">
                  <div className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-brand-gold" />
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">
                    {session.user?.name ?? session.user?.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[180px] rounded-xl border border-border bg-bg-card p-1 shadow-card animate-slide-up"
                  sideOffset={8}
                  align="end"
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary cursor-pointer hover:bg-bg-elevated outline-none"
                    >
                      <User className="w-4 h-4 text-muted" />
                      Profile
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 cursor-pointer hover:bg-red-900/20 outline-none"
                    onSelect={() => signOut({ callbackUrl: "/deckforge" })}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md text-secondary hover:text-primary hover:bg-bg-elevated transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface px-4 py-3 space-y-1">
          {session &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(link.href)
                    ? "bg-bg-elevated text-primary"
                    : "text-secondary hover:text-primary hover:bg-bg-elevated"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
        </div>
      )}
    </header>
  );
}
