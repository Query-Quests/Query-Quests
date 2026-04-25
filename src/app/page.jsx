"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChartBar,
  FileCode,
  Mail,
  Quote,
  UserPlus,
} from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";

/**
 * Public landing page. Translates the Pencil "02 · Landing /" frame
 * (kuuU5) section-by-section: Hero · Stats · Logos · Features ·
 * How it works · Testimonials · CTA. Dark navy theme everywhere
 * except the white "How it works" band.
 *
 * The "For Institutions" header link goes to `/contact`. There
 * is no Pricing section yet, so the corresponding header link is
 * also omitted; reintroduce it when a real pricing section ships.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--navy-dark)] text-white">
      <PublicHeader variant="dark" />
      <main>
        <HeroSection />
        <LogosSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Hero                                                          */
/* ──────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      className="relative px-6 lg:px-20 py-24 lg:py-32 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Radial green glow at top, per Pencil */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 140% 60% at 50% 15%, rgba(25,170,89,0.18) 0%, rgba(25,170,89,0) 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center gap-10">
        {/* Title */}
        <h1
          id="hero-heading"
          className="text-center font-bold tracking-[-0.04em] text-5xl sm:text-6xl lg:text-[80px] leading-[1.05]"
        >
          <span className="text-white">Master SQL with</span>
          <br />
          <span className="text-[var(--accent-green)]">real challenges</span>
        </h1>

        {/* Subtitle */}
        <p className="text-center text-lg lg:text-xl text-gray-400 max-w-2xl leading-relaxed">
          We help educational institutions teach SQL effectively, and thousands
          of students become skilled database professionals through hands-on
          practice.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/auth?tab=register">
            <Button className="px-10 py-6 h-auto rounded-xl bg-[var(--accent-green)] text-white text-base font-bold hover:bg-[#15934d] transition-colors">
              Start learning free
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              className="px-10 py-6 h-auto rounded-xl bg-transparent border border-white/10 text-white text-base font-bold hover:bg-white/5 hover:border-white/20 hover:text-white"
            >
              For institutions
            </Button>
          </Link>
        </div>

        {/* Code editor mockup */}
        <CodeEditorMockup />
      </div>
    </section>
  );
}

function CodeEditorMockup() {
  const lines = [
    { num: 1, text: "-- Find the top 5 students by points this semester" },
    {
      num: 2,
      jsx: (
        <>
          <span className="text-[#c084fc]">SELECT</span>{" "}
          <span className="text-white">name, total_score, institution_id</span>
        </>
      ),
    },
    {
      num: 3,
      jsx: (
        <>
          <span className="text-[#c084fc]">FROM</span>{" "}
          <span className="text-white">users</span>
        </>
      ),
    },
    {
      num: 4,
      jsx: (
        <>
          <span className="text-[#c084fc]">WHERE</span>{" "}
          <span className="text-white">institution_id =</span>{" "}
          <span className="text-[#fde68a]">&apos;uca&apos;</span>
        </>
      ),
    },
    {
      num: 5,
      jsx: (
        <>
          <span className="text-[#c084fc]">ORDER BY</span>{" "}
          <span className="text-white">total_score</span>{" "}
          <span className="text-[#c084fc]">DESC</span>
        </>
      ),
    },
    {
      num: 6,
      jsx: (
        <>
          <span className="text-[#c084fc]">LIMIT</span>{" "}
          <span className="text-[#fbbf24]">5</span>
          <span className="text-gray-500">;</span>
        </>
      ),
    },
  ];

  return (
    <div
      className="w-full max-w-[1000px] rounded-2xl border border-white/[0.06] bg-[var(--navy-deep)] overflow-hidden"
      style={{ boxShadow: "0 8px 80px rgba(25,170,89,0.21)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-amber-500" />
        <span className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="ml-3 text-xs font-medium text-gray-500 font-mono">
          query.sql
        </span>
      </div>
      <pre className="px-7 py-6 text-sm font-mono leading-7 overflow-x-auto">
        {lines.map((l) => (
          <div key={l.num} className="flex">
            <span className="text-gray-600 select-none w-8 shrink-0">
              {l.num}
            </span>
            <span className={l.text ? "text-gray-500" : ""}>
              {l.text || l.jsx}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Logos                                                         */
/* ──────────────────────────────────────────────────────────── */

function LogosSection() {
  const logos = [{ name: "UCA", href: "https://www.uca.es" }];
  return (
    <section
      className="px-6 lg:px-20 py-12 border-t border-white/[0.06]"
      aria-label="Backed at University of Cadiz"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <p className="text-xs font-semibold text-gray-500 tracking-[0.16em]">
          BACKED AT UNIVERSITY OF CADIZ
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-4">
          {logos.map((logo) => (
            <a
              key={logo.name}
              href={logo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold text-gray-500 hover:text-gray-300 transition-colors"
            >
              {logo.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Features                                                      */
/* ──────────────────────────────────────────────────────────── */

function FeaturesSection() {
  const features = [
    {
      title: "Interactive Terminal",
      description:
        "Write and execute SQL queries in a real database environment with instant feedback.",
    },
    {
      title: "Real-time Feedback",
      description:
        "Get instant feedback on your queries with detailed error explanations and optimization suggestions.",
    },
    {
      title: "Analytics Dashboard",
      description:
        "Track student progress, identify common struggles, and measure learning outcomes in real time.",
    },
    {
      title: "Auto-grading",
      description:
        "Automatic query validation and grading with customizable rubrics and comprehensive test cases.",
    },
    {
      title: "Sandbox Databases",
      description:
        "Practice on isolated database sandboxes with real schemas used in industry applications.",
    },
    {
      title: "Learning Paths",
      description:
        "Progressive challenges from basics to advanced topics, aligned with academic standards and curricula.",
    },
  ];

  return (
    <section
      id="features"
      className="relative px-6 lg:px-20 py-24"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
        {/* Heading block */}
        <div className="flex flex-col items-center gap-4">
          <Pill text="Powerful Features" />
          <h2
            id="features-heading"
            className="text-center font-bold tracking-[-0.03em] text-4xl sm:text-5xl lg:text-[56px] leading-[1.05] max-w-3xl"
          >
            Everything you need to teach SQL
          </h2>
          <p className="text-center text-lg text-gray-400 max-w-xl">
            A complete platform designed for educators and students to master
            database skills
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-white/[0.12] transition-colors">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-[15px] text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Pill({ text }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08]">
      <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
      <span className="text-[13px] font-medium text-gray-300">{text}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* How it works (white band)                                     */
/* ──────────────────────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Register",
      description: "Create your institution account in minutes",
    },
    {
      number: "02",
      icon: Mail,
      title: "Invite",
      description: "Add students via email domain verification",
    },
    {
      number: "03",
      icon: FileCode,
      title: "Assign",
      description: "Create or select challenges for your course",
    },
    {
      number: "04",
      icon: ChartBar,
      title: "Track",
      description: "Monitor progress with detailed analytics",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-white text-[var(--navy-dark)] px-6 lg:px-20 py-24"
      aria-labelledby="how-heading"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-14">
        <div className="flex flex-col items-center gap-3">
          <h2
            id="how-heading"
            className="text-center font-bold tracking-[-0.03em] text-4xl sm:text-5xl lg:text-[52px] leading-[1.1]"
          >
            Get started in 4 steps
          </h2>
          <p className="text-center text-lg text-gray-500">
            Simple setup for institutions and educators
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {steps.map((s) => (
            <StepCard key={s.number} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, icon: Icon, title, description }) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-7 hover:border-gray-300 transition-colors">
      <span
        aria-hidden
        className="absolute top-5 right-6 text-6xl font-bold text-gray-100 select-none"
      >
        {number}
      </span>
      <div className="relative">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--accent-green)]/10 mb-5">
          <Icon className="h-5 w-5 text-[var(--accent-green)]" aria-hidden />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-[15px] text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Testimonials                                                  */
/* ──────────────────────────────────────────────────────────── */

function TestimonialsSection() {
  const testimonials = [
    {
      initials: "AB",
      avatarColor: "bg-[var(--accent-green)]",
      name: "Antonio Balderas",
      role: "Professor of Databases · UCA",
      quote:
        "QueryQuest has changed how we teach databases at UCA. Students can practice on real schemas instead of toy examples, and I can see their progress in real time.",
    },
    {
      initials: "AO",
      avatarColor: "bg-[var(--info)]",
      name: "Álvaro Orellana",
      role: "CS Student · UCA",
      quote:
        "QueryQuest is what made me fall in love with databases. The challenges go beyond writing queries — they got me thinking about how schemas should be designed and set up from scratch.",
    },
    {
      initials: "JM",
      avatarColor: "bg-amber-500",
      name: "Julio Martín",
      role: "CS Student · UCA",
      quote:
        "Working through the levels at my own pace gave me way more practice than lectures alone. Running queries against real datasets and getting instant feedback is what made everything click.",
    },
  ];

  return (
    <section
      className="bg-[var(--navy-deep)] px-6 lg:px-20 py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4">
          <Pill text="What Our Users Say" />
          <h2
            id="testimonials-heading"
            className="text-center font-bold tracking-[-0.03em] text-4xl sm:text-5xl lg:text-[48px] leading-[1.1] max-w-3xl"
          >
            Loved by educators and students
          </h2>
          <p className="text-center text-lg text-gray-400 max-w-xl">
            See why thousands trust QueryQuest for SQL education
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ initials, avatarColor, name, role, quote }) {
  return (
    <figure className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
      <Quote className="h-6 w-6 text-[var(--accent-green)] mb-4" aria-hidden />
      <blockquote className="text-[15px] text-gray-300 leading-relaxed mb-6">
        {quote}
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${avatarColor} text-white text-sm font-bold`}
        >
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{name}</span>
          <span className="text-xs text-gray-500">{role}</span>
        </div>
      </figcaption>
    </figure>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* CTA (also serves as #pricing anchor)                          */
/* ──────────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section
      className="relative px-6 lg:px-20 py-24 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Green radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(25,170,89,0.20) 0%, rgba(25,170,89,0) 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-8 text-center">
        <h2
          id="cta-heading"
          className="font-bold tracking-[-0.03em] text-4xl sm:text-5xl lg:text-[48px] leading-[1.1]"
        >
          Ready to transform how you teach SQL?
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl">
          Bring QueryQuest to your university and give your students
          hands-on SQL practice on real schemas.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/auth?tab=register">
            <Button className="px-10 py-6 h-auto rounded-xl bg-[var(--accent-green)] text-white text-base font-bold hover:bg-[#15934d] transition-colors">
              Start free trial
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              className="px-10 py-6 h-auto rounded-xl bg-transparent border border-white/10 text-white text-base font-bold hover:bg-white/5 hover:border-white/20 hover:text-white"
            >
              Contact sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
