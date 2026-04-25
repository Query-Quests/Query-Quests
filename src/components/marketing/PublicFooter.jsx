"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronUp, Github } from "lucide-react";

/**
 * Marketing-side footer, reused across all public pages
 * (`/`, `/terms`, `/privacy`, future `/contact`, etc.).
 *
 * `/auth` (login/register) deliberately does NOT use this footer.
 * The authenticated app does not show a footer at all.
 */
export default function PublicFooter() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      className="bg-[var(--navy-dark)] pt-24 pb-16 px-6 relative overflow-hidden"
      role="contentinfo"
    >
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-1/4 w-1 h-1 bg-[var(--accent-green)] rounded-full opacity-50 animate-pulse" />
        <div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-teal-400 rounded-full opacity-30" />
        <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-white rounded-full opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Tagline */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl text-white/90 font-light tracking-wide">
            The future of SQL education is{" "}
            <span className="text-[var(--accent-green)] font-bold text-4xl md:text-5xl">
              interactive
            </span>
            .
          </h2>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/10 pt-16">
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">
              Platform
            </h4>
            <Link
              href="/challenges"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="/lessons"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Lessons
            </Link>
            <Link
              href="/playground"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Playground
            </Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">
              Institutions
            </h4>
            <Link
              href="/auth"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Request Demo
            </Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">
              Legal
            </h4>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
          <div className="flex flex-col space-y-6">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">
              Connect
            </h4>
            <div className="flex space-x-4">
              <a
                href="https://github.com/Query-Quests/Query-Quests"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">QueryQuest</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} QueryQuest. All rights reserved.
          </p>
        </div>
      </div>

      {/* Scroll-to-top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all z-50 ${
          showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5 text-[var(--navy-dark)]" />
      </button>
    </footer>
  );
}
