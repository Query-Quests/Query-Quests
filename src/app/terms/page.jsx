"use client";

import LegalPage from "@/components/legal/LegalPage";

const SECTIONS = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of terms",
    tocLabel: "Acceptance of terms",
    body: (
      <p>
        By accessing QueryQuest you agree to these Terms. If you don&apos;t
        agree, don&apos;t use the service. Your institution&apos;s policies may
        also apply alongside these Terms.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    tocLabel: "Acceptable use",
    body: (
      <p>
        Don&apos;t attempt to extract solutions to challenges outside the
        platform, don&apos;t share accounts, and don&apos;t run queries
        designed to degrade shared infrastructure. Respect your classmates.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    tocLabel: "Intellectual property",
    body: (
      <p>
        Challenge content is owned by QueryQuest or contributed by partner
        institutions under license. Your submitted queries remain yours.
      </p>
    ),
  },
  {
    id: "service-availability",
    title: "Service availability",
    tocLabel: "Service availability",
    body: (
      <p>
        QueryQuest aims for 99.9% uptime but does not guarantee uninterrupted
        access. Scheduled maintenance windows are communicated in advance. We
        reserve the right to modify or discontinue features with reasonable
        notice.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    tocLabel: "Limitation of liability",
    body: (
      <p>
        QueryQuest is provided &ldquo;as is&rdquo; without warranties of any
        kind. We are not liable for any indirect, incidental, or consequential
        damages arising from your use of the platform, including but not
        limited to loss of data or academic outcomes.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    tocLabel: "Termination",
    body: (
      <p>
        We may suspend or terminate your account for violations of these
        Terms. Your institution may also revoke access. Upon termination,
        your submitted queries and progress data will be retained for 90
        days before permanent deletion.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to terms",
    tocLabel: "Changes to terms",
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be
        communicated via email or in-app notification at least 14 days before
        taking effect. Continued use after changes constitutes acceptance.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      kind="terms"
      title="Terms of Service"
      lastUpdated="April 20, 2026"
      sections={SECTIONS}
    />
  );
}
