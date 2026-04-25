"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Marketing-side navigation, reused across all public pages
 * (`/`, `/terms`, `/privacy`, future `/contact`, etc.). `/auth`
 * deliberately does NOT use this — it has its own split-screen
 * layout per the Pencil design.
 *
 * @param {Object} props
 * @param {'light'|'dark'} [props.variant]
 *   `light` (default) — white background, dark text. Used by legal
 *   pages and most secondary public pages.
 *   `dark` — navy-dark background, white text, gray links. Matches
 *   the Pencil Landing nav (`ZQwuK`); the bg is opaque so the dark
 *   hero below can use its own gradient.
 */
export default function PublicHeader({ variant = "light" }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = variant === "dark";

  const wrapperBase = "sticky top-0 z-50 transition-all duration-300";
  const wrapperLight = scrolled
    ? "bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm"
    : "bg-white";
  const wrapperDark = scrolled
    ? "bg-[var(--navy-dark)]/95 backdrop-blur-sm border-b border-white/10"
    : "bg-[var(--navy-dark)] border-b border-white/10";

  const logoText = dark ? "text-white" : "text-[var(--navy-dark)]";
  const linkText = dark
    ? "text-gray-400 hover:text-white"
    : "text-gray-600 hover:text-[var(--accent-green)]";
  const loginText = dark
    ? "text-gray-400 hover:text-white"
    : "text-gray-600 hover:text-[var(--accent-green)]";

  return (
    <nav
      className={`${wrapperBase} ${dark ? wrapperDark : wrapperLight}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="QueryQuest Home"
          >
            <span className={`text-lg font-bold ${logoText}`}>QueryQuest</span>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="/#features"
              className={`text-[14px] font-medium transition-colors ${linkText}`}
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className={`text-[14px] font-medium transition-colors ${linkText}`}
            >
              How it Works
            </Link>
            <Link
              href="/contact"
              className={`text-[14px] font-medium transition-colors ${linkText}`}
            >
              For Institutions
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/auth" className="hidden sm:block">
            <Button
              variant="ghost"
              className={`text-[14px] font-medium ${loginText} hover:bg-transparent`}
            >
              Log In
            </Button>
          </Link>
          <Link href="/auth?tab=register">
            <Button
              className={
                dark
                  ? "px-5 py-2 bg-[var(--accent-green)] text-white text-[14px] font-semibold hover:bg-[#15934d]"
                  : "px-5 py-2 bg-[var(--navy-dark)] text-white text-[14px] font-semibold hover:bg-gray-800"
              }
            >
              Create free account
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
