"use client";

import { useEffect, useState } from "react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";

/**
 * Shared shell for /terms and /privacy.
 * Mirrors the Pencil design (`Organism/LegalHeaderBlock`,
 * `Organism/LegalTOC`, `Organism/LegalSection` from
 * QueryQuestDesign.pen). Wraps the content in the shared marketing
 * `PublicHeader` / `PublicFooter` so all public pages (landing,
 * legal, future contact, …) share one nav and footer. `/auth` keeps
 * its own split-screen layout.
 *
 * @typedef {Object} LegalSection
 * @property {string} id          anchor + IntersectionObserver target
 * @property {string} title       full numbered heading text rendered in the body
 * @property {string} tocLabel    short label rendered in the left TOC
 * @property {React.ReactNode} body  rich content for the section
 */

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

export default function LegalPage({ kind, title, lastUpdated, sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-white text-[#030914]" style={FONT_STYLE}>
      <PublicHeader />

      <main className="mx-auto max-w-[1200px] px-6 sm:px-12 lg:px-[120px] py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-10">
          <Toc sections={sections} activeId={activeId} />
          <article className="max-w-[640px] flex flex-col gap-8">
            <Header kind={kind} title={title} lastUpdated={lastUpdated} />
            <hr className="border-t border-gray-200" />
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="flex flex-col gap-3.5 scroll-mt-24"
              >
                <h2 className="text-[22px] font-bold leading-[1.3] tracking-[-0.5px]">
                  {i + 1}. {s.title}
                </h2>
                <div className="text-[15px] text-gray-700 leading-[1.7] space-y-4">
                  {s.body}
                </div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Header({ kind, title, lastUpdated }) {
  return (
    <header className="flex flex-col gap-4">
      <p
        className="text-[11px] font-bold text-[#19aa59] uppercase"
        style={{ letterSpacing: "2.4px" }}
      >
        Legal · {title}
      </p>
      <h1 className="text-[48px] font-bold leading-[1.05] tracking-[-1.5px]">
        {title}
      </h1>
      <p className="text-[13px] text-gray-500">
        Last updated {lastUpdated}
      </p>
    </header>
  );
}

function Toc({ sections, activeId }) {
  return (
    <aside className="lg:sticky lg:top-12 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="border-l-2 border-gray-200 py-1 pl-5">
        <p
          className="text-[11px] font-bold text-gray-500 uppercase mb-3"
          style={{ letterSpacing: "1.8px" }}
        >
          On this page
        </p>
        <nav className="flex flex-col gap-2.5">
          {sections.map((s) => {
            const active = activeId === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={[
                  "text-[13px] transition-colors",
                  active
                    ? "font-semibold text-[#19aa59]"
                    : "font-medium text-gray-500 hover:text-[#030914]",
                ].join(" ")}
              >
                {s.tocLabel}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
