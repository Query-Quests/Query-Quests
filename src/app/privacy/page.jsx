"use client";

import LegalPage from "@/components/legal/LegalPage";

const SECTIONS = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    tocLabel: "Information we collect",
    body: (
      <p>
        QueryQuest collects information you provide when creating an
        account&nbsp;— your name, institution email address, and academic
        affiliation. We also record activity on challenges you attempt and
        your progress metrics.
      </p>
    ),
  },
  {
    id: "how-we-use-your-information",
    title: "How we use your information",
    tocLabel: "How we use your information",
    body: (
      <p>
        Your data is used to operate the platform, personalize learning,
        generate aggregated analytics for your institution, and to
        communicate important service updates. We never sell personal data.
      </p>
    ),
  },
  {
    id: "data-retention",
    title: "Data retention",
    tocLabel: "Data retention",
    body: (
      <p>
        Account data is retained while your account is active and for 90
        days after deletion. Anonymized analytics may be retained longer for
        academic research purposes.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    tocLabel: "Your rights",
    body: (
      <p>
        You may request access to, correction of, or deletion of your
        personal data at any time by contacting{" "}
        <a
          href="mailto:support@queryquest.dev"
          className="text-[#19aa59] hover:underline"
        >
          support@queryquest.dev
        </a>
        . Institutional administrators may also manage student data within
        their organization&apos;s dashboard.
      </p>
    ),
  },
  {
    id: "cookies-and-tracking",
    title: "Cookies & tracking",
    tocLabel: "Cookies & tracking",
    body: (
      <p>
        QueryQuest uses essential cookies for authentication and session
        management. We use privacy-respecting analytics (no third-party ad
        trackers). You can disable non-essential cookies in your browser
        settings without affecting core functionality.
      </p>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    tocLabel: "Third-party services",
    body: (
      <p>
        We integrate with institutional SSO providers and use cloud
        infrastructure hosted in the EU. No personal data is shared with
        advertising networks. Payment processing, where applicable, is
        handled by Stripe under their own privacy policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    tocLabel: "Contact",
    body: (
      <p>
        For any privacy-related inquiries, contact our Data Protection
        Officer at{" "}
        <a
          href="mailto:privacy@queryquest.dev"
          className="text-[#19aa59] hover:underline"
        >
          privacy@queryquest.dev
        </a>{" "}
        or write to QueryQuest Inc., 123 University Ave, Suite 400, San
        Francisco, CA 94102.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      kind="privacy"
      title="Privacy Policy"
      lastUpdated="April 20, 2026"
      sections={SECTIONS}
    />
  );
}
