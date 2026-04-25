"use client";

import { useState } from "react";
import { Mail, Building, MessageSquare, Send } from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";
import ContactForm from "@/components/ContactForm";
import { Button } from "@/components/ui/button";

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

/**
 * Public `/contact` page. Mirrors the shell pattern used by
 * `LegalPage` (PublicHeader at top, centred content, PublicFooter at
 * bottom) and reuses the existing `ContactForm` component as a modal
 * that opens from a CTA on this page.
 *
 * `ContactForm` posts to `/api/contact` (institution access requests).
 */
export default function ContactPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-white text-[#030914]"
      style={FONT_STYLE}
    >
      <PublicHeader />

      <main className="mx-auto max-w-[1200px] px-6 sm:px-12 lg:px-[120px] py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left column: heading + contact details */}
          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-4">
              <p
                className="text-[11px] font-bold text-[#19aa59] uppercase"
                style={{ letterSpacing: "2.4px" }}
              >
                Contact · Get in touch
              </p>
              <h1 className="text-[48px] font-bold leading-[1.05] tracking-[-1.5px]">
                Get in touch
              </h1>
              <p className="text-[15px] text-gray-700 leading-[1.7] max-w-[520px]">
                Whether you&apos;re an institution looking to onboard your
                students, an educator with a question, or a student with
                feedback&nbsp;— we&apos;d love to hear from you. Send us a
                message and we&apos;ll get back to you within a few business
                days.
              </p>
            </header>

            <hr className="border-t border-gray-200" />

            <ul className="flex flex-col gap-5 text-[14px]">
              <li className="flex items-start gap-3">
                <span className="bg-[#19aa59]/10 p-2 rounded-lg shrink-0">
                  <Mail className="h-4 w-4 text-[#19aa59]" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-[#030914]">Email</span>
                  <a
                    href="mailto:support@queryquest.dev"
                    className="text-gray-700 hover:text-[#19aa59] transition-colors"
                  >
                    support@queryquest.dev
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#19aa59]/10 p-2 rounded-lg shrink-0">
                  <Building className="h-4 w-4 text-[#19aa59]" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-[#030914]">
                    Institution access
                  </span>
                  <span className="text-gray-700 leading-[1.6]">
                    Use the form to request access for your university or
                    school. We&apos;ll set up your domain&apos;s student and
                    teacher email suffixes.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#19aa59]/10 p-2 rounded-lg shrink-0">
                  <MessageSquare className="h-4 w-4 text-[#19aa59]" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-[#030914]">
                    Response time
                  </span>
                  <span className="text-gray-700 leading-[1.6]">
                    Typically 1&ndash;3 business days.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Right column: form CTA card */}
          <div className="lg:sticky lg:top-12 lg:self-start">
            <div className="border border-gray-200 rounded-2xl p-8 sm:p-10 bg-white shadow-sm flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <h2 className="text-[22px] font-bold leading-[1.3] tracking-[-0.5px]">
                  Request institution access
                </h2>
                <p className="text-[14px] text-gray-700 leading-[1.6]">
                  Tell us about your institution and the student / teacher
                  email domains you&apos;d like enabled. We&apos;ll review and
                  follow up by email.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setFormOpen(true)}
                className="w-full bg-[var(--accent-green)] hover:bg-[#15934d] text-white text-[14px] font-semibold py-6"
              >
                <Send className="mr-2 h-4 w-4" />
                Open contact form
              </Button>
              <p className="text-[12px] text-gray-500 leading-[1.6]">
                You can also email us directly at{" "}
                <a
                  href="mailto:support@queryquest.dev"
                  className="text-[#19aa59] hover:underline"
                >
                  support@queryquest.dev
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      {formOpen ? <ContactForm onClose={() => setFormOpen(false)} /> : null}
    </div>
  );
}
