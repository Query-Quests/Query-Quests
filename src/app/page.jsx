"use client";

import { Button } from "@/components/ui/button";
import {
  Database,
  ArrowRight,
  ChevronUp,
  Twitter,
  Linkedin,
  Github,
  GraduationCap,
  Building2,
  Award,
  Terminal,
  BookOpen,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Navigation Component
function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm" : "bg-white"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="QueryQuest Home">
            <div className="bg-[var(--accent-green)] p-1.5 rounded-lg">
              <Database className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-[var(--navy-dark)]">QueryQuest</span>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            <Link href="#features" className="text-[15px] font-medium text-gray-600 hover:text-[var(--accent-green)] transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-[15px] font-medium text-gray-600 hover:text-[var(--accent-green)] transition-colors">
              How it Works
            </Link>
            <Link href="#institutions" className="text-[15px] font-medium text-gray-600 hover:text-[var(--accent-green)] transition-colors">
              For Institutions
            </Link>
            <Link href="#pricing" className="text-[15px] font-medium text-gray-600 hover:text-[var(--accent-green)] transition-colors">
              Pricing
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/auth" className="hidden sm:block">
            <Button variant="ghost" className="text-[15px] font-medium text-gray-600 hover:text-[var(--accent-green)]">
              Log In
            </Button>
          </Link>
          <Link href="/auth?tab=register">
            <Button className="px-5 py-2 bg-[var(--navy-dark)] text-white text-[15px] font-semibold hover:bg-gray-800">
              Create free account
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="bg-white pt-20 pb-16 px-6" aria-labelledby="hero-heading">
      <div className="max-w-7xl mx-auto text-center">
        <h1 id="hero-heading" className="text-6xl md:text-7xl lg:text-[80px] leading-[1.1] font-bold tracking-tight mb-8 text-[var(--navy-dark)]">
          <span className="text-[var(--accent-green)]">Master</span> SQL with
          <br />
          real challenges
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-light mb-12 leading-relaxed">
          We help educational institutions teach SQL effectively, and thousands of students
          become skilled database professionals through hands-on practice.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link href="/auth?tab=register">
            <Button className="px-10 py-6 h-auto bg-[var(--navy-dark)] text-white text-lg font-bold hover:bg-gray-800 hover:scale-[1.02] transition-all">
              Start learning free
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" className="px-10 py-6 h-auto border-2 border-gray-300 text-[var(--navy-dark)] text-lg font-bold hover:border-gray-400 hover:bg-gray-50 hover:scale-[1.02] transition-all">
              For institutions
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-12 md:gap-20 mb-16">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[var(--navy-dark)]">200+</div>
            <div className="text-gray-500 font-medium mt-1">Institutions</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[var(--navy-dark)]">50K+</div>
            <div className="text-gray-500 font-medium mt-1">Students</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[var(--navy-dark)]">1M+</div>
            <div className="text-gray-500 font-medium mt-1">Challenges Solved</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[var(--accent-green)]">98%</div>
            <div className="text-gray-500 font-medium mt-1">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Institution Logos Section
function LogosSection() {
  const institutions = [
    "MIT", "Stanford", "Harvard", "Berkeley", "Columbia", "Yale",
    "Princeton", "Cornell", "UCLA", "Georgia Tech", "CMU", "Caltech"
  ];

  return (
    <section className="bg-white py-16 px-6" aria-label="Trusted by leading institutions">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-widest mb-10">
          Trusted by leading educational institutions
        </p>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {institutions.map((name, index) => (
            <div
              key={index}
              className="flex items-center justify-center px-4 py-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default"
            >
              <GraduationCap className="h-5 w-5 mr-2 text-gray-600" aria-hidden="true" />
              <span className="font-semibold text-gray-700 text-sm">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Terminal,
      title: "Interactive Terminal",
      description: "Write and execute SQL queries in a real database environment with instant feedback.",
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/20",
    },
    {
      icon: BookOpen,
      title: "Structured Curriculum",
      description: "Progressive challenges from basics to advanced, aligned with academic standards.",
      gradient: "from-blue-500 to-indigo-600",
      bgGlow: "bg-blue-500/20",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track student progress, identify struggles, and measure learning outcomes.",
      gradient: "from-violet-500 to-purple-600",
      bgGlow: "bg-violet-500/20",
    },
    {
      icon: Award,
      title: "Gamified Learning",
      description: "Points, leaderboards, and achievements keep students engaged and motivated.",
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/20",
    },
    {
      icon: Building2,
      title: "Institution Control",
      description: "Manage users, create custom challenges, and control access per institution.",
      gradient: "from-rose-500 to-pink-600",
      bgGlow: "bg-rose-500/20",
    },
    {
      icon: Database,
      title: "Real Databases",
      description: "Practice on actual database schemas used in industry applications.",
      gradient: "from-cyan-500 to-blue-600",
      bgGlow: "bg-cyan-500/20",
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6 overflow-hidden" aria-labelledby="features-heading">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--navy-dark)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDMiIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-50" />

      {/* Decorative glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[var(--accent-green)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Powerful Features</span>
          </div>
          <h2 id="features-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Everything you need to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-green)] via-emerald-400 to-teal-400">teach SQL</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A complete platform designed for educators and students to master database skills
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500 hover:-translate-y-1"
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 ${feature.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[var(--accent-green)] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                {feature.description}
              </p>

              {/* Corner accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-[100px] rounded-tr-2xl`} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">And many more features to explore</p>
          <Link href="/auth?tab=register">
            <Button className="bg-[var(--accent-green)] hover:bg-[#15934d] text-white font-semibold px-8 py-3 h-auto shadow-lg shadow-[var(--accent-green)]/25 hover:shadow-[var(--accent-green)]/40 transition-all">
              Explore all features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    { number: "01", title: "Register", description: "Create your institution account in minutes" },
    { number: "02", title: "Invite", description: "Add students via email domain verification" },
    { number: "03", title: "Assign", description: "Create or select challenges for your course" },
    { number: "04", title: "Track", description: "Monitor progress with detailed analytics" },
  ];

  return (
    <section id="how-it-works" className="bg-white py-24 px-6" aria-labelledby="how-it-works-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 id="how-it-works-heading" className="text-4xl md:text-5xl font-bold text-[var(--navy-dark)] mb-4">
            Get started in <span className="text-[var(--accent-green)]">4 steps</span>
          </h2>
          <p className="text-xl text-gray-500">Simple setup for institutions and educators</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-[2px] bg-gradient-to-r from-[var(--accent-green)]/30 to-transparent" aria-hidden="true" />
              )}
              <div className="relative">
                <span className="text-7xl font-bold text-gray-100">{step.number}</span>
                <h3 className="text-2xl font-bold text-[var(--navy-dark)] -mt-4 mb-2">{step.title}</h3>
                <p className="text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Gradient Separator
function GradientSeparator() {
  return (
    <div
      className="h-64 w-full relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #30c888 50%, #1693ac 75%, var(--navy-dark) 100%)",
      }}
      aria-hidden="true"
    >
      {/* Grid dots decoration */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

// Dark Footer
function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-[var(--navy-dark)] pt-24 pb-16 px-6 relative overflow-hidden" role="contentinfo">
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
            <span className="text-[var(--accent-green)] font-bold text-4xl md:text-5xl">interactive</span>.
          </h2>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/10 pt-16">
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">Platform</h4>
            <Link href="/challenges" className="text-gray-400 hover:text-white transition-colors">Challenges</Link>
            <Link href="/lessons" className="text-gray-400 hover:text-white transition-colors">Lessons</Link>
            <Link href="/playground" className="text-gray-400 hover:text-white transition-colors">Playground</Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">Institutions</h4>
            <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">Get Started</Link>
            <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">Request Demo</Link>
          </div>
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">Legal</h4>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex flex-col space-y-6">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--accent-green)] p-1.5 rounded-lg">
              <Database className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-white font-bold">QueryQuest</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} QueryQuest. All rights reserved.
          </p>
        </div>
      </div>

      {/* Scroll to top button */}
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

// CTA Section before gradient
function CTASection() {
  return (
    <section className="bg-white py-24 px-6" aria-labelledby="cta-heading">
      <div className="max-w-4xl mx-auto text-center">
        <h2 id="cta-heading" className="text-4xl md:text-5xl font-bold text-[var(--navy-dark)] mb-6">
          Ready to transform how you <span className="text-[var(--accent-green)]">teach SQL</span>?
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Join 200+ institutions already using QueryQuest to deliver world-class database education.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth?tab=register">
            <Button className="px-10 py-6 h-auto bg-[var(--accent-green)] text-white text-lg font-bold hover:bg-[#15934d] hover:scale-[1.02] transition-all">
              Start free trial
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" className="px-10 py-6 h-auto border-2 border-gray-300 text-[var(--navy-dark)] text-lg font-bold hover:border-gray-400 hover:bg-gray-50">
              Contact sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Main Landing Page
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--navy-dark)]">
      <Navigation />
      <main>
        <HeroSection />
        <LogosSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
        <GradientSeparator />
      </main>
      <Footer />
    </div>
  );
}
