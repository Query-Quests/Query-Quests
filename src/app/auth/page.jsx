"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Database,
  ArrowRight,
  Building,
  CheckCircle2,
  Terminal,
  Trophy,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    message: "",
    institution: null,
    role: null,
  });
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const validateEmail = async (email) => {
    if (!email || email.length < 5) {
      setEmailValidation({ isValid: false, message: "", institution: null, role: null });
      return;
    }

    setIsValidatingEmail(true);
    try {
      const response = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setEmailValidation(data);
    } catch (error) {
      setEmailValidation({ isValid: false, message: "Error validating email", institution: null, role: null });
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setShowResendVerification(false);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Login successful! Redirecting...");
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => {
          window.location.href = "/home";
        }, 1000);
      } else {
        setError(data.error || "Login failed");
        if (response.status === 403) {
          setShowResendVerification(true);
        }
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setSuccess("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email }),
      });
      const data = await res.json();
      setSuccess(data.message || "Verification email sent.");
      setShowResendVerification(false);
    } catch {
      setError("Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!emailValidation.isValid) {
      setError("Please use a valid email address from a registered institution");
      setIsLoading(false);
      return;
    }

    if (!registerForm.terms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${registerForm.firstName} ${registerForm.lastName}`,
          email: registerForm.email,
          password: registerForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Registration successful! Please check your email to verify your account.");
        setActiveTab("login");
        setRegisterForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          terms: false,
        });
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="bg-[#19aa59] p-2 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#030914]">QueryQuest</span>
            </Link>
            <h1 className="text-3xl font-bold text-[#030914] mb-2">
              {activeTab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-gray-500">
              {activeTab === "login"
                ? "Sign in to continue your SQL journey"
                : "Start mastering SQL with interactive challenges"}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "login"
                  ? "bg-white text-[#030914] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "register"
                  ? "bg-white text-[#030914] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              {showResendVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-2 text-sm text-[#19aa59] hover:text-[#15934d] font-semibold disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend verification email"}
                </button>
              )}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-600 font-medium">{success}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#030914]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="pl-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59]"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#030914]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pl-12 pr-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59]"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#19aa59] focus:ring-[#19aa59]"
                    checked={loginForm.remember}
                    onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#19aa59] hover:text-[#15934d] font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#030914] hover:bg-gray-800 text-white font-semibold rounded-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-[#030914]">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="John"
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59]"
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-[#030914]">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Doe"
                      className="pl-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59]"
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerEmail" className="text-sm font-medium text-[#030914]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="registerEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="john@university.edu"
                    className={`pl-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59] ${
                      emailValidation.isValid
                        ? "border-green-500 bg-green-50/50"
                        : emailValidation.message && !emailValidation.isValid
                        ? "border-red-500 bg-red-50/50"
                        : ""
                    }`}
                    value={registerForm.email}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, email: e.target.value });
                      clearTimeout(window.emailValidationTimeout);
                      window.emailValidationTimeout = setTimeout(() => {
                        validateEmail(e.target.value);
                      }, 500);
                    }}
                    required
                  />
                  {isValidatingEmail && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#19aa59] border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {emailValidation.message && (
                  <div className={`text-sm ${emailValidation.isValid ? "text-green-600" : "text-red-600"}`}>
                    {emailValidation.message}
                    {!emailValidation.isValid && emailValidation.message.includes("not recognized") && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowContactForm(true)}
                          className="text-xs border-gray-300 hover:border-[#19aa59] hover:text-[#19aa59]"
                        >
                          <Building className="mr-1 h-3 w-3" />
                          Request Institution Access
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerPassword" className="text-sm font-medium text-[#030914]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="registerPassword"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className="pl-12 pr-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59]"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#030914]">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    className="pl-12 pr-12 h-12 border-gray-200 rounded-xl focus:border-[#19aa59] focus:ring-[#19aa59]"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#19aa59] focus:ring-[#19aa59]"
                  checked={registerForm.terms}
                  onChange={(e) => setRegisterForm({ ...registerForm, terms: e.target.checked })}
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#19aa59] hover:text-[#15934d] font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#19aa59] hover:text-[#15934d] font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <Button
                type="submit"
                className="w-full h-12 bg-[#19aa59] hover:bg-[#15934d] text-white font-semibold rounded-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            {activeTab === "login" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setActiveTab("register")}
                  className="text-[#19aa59] hover:text-[#15934d] font-semibold"
                >
                  Sign up for free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => setActiveTab("login")}
                  className="text-[#19aa59] hover:text-[#15934d] font-semibold"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#030914] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDMiIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-50" />

        {/* Decorative glows */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#19aa59]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="max-w-lg text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-[#19aa59] to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#19aa59]/25">
              <Terminal className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              Master SQL with
              <span className="text-[#19aa59]"> Confidence</span>
            </h2>
            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              Join thousands of learners who have improved their database skills through our interactive SQL challenges and real-world projects.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-gray-400">Challenges</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-[#19aa59] mb-1">50K+</div>
                <div className="text-sm text-gray-400">Students</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-white mb-1">98%</div>
                <div className="text-sm text-gray-400">Success</div>
              </div>
            </div>

            {/* Features list */}
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 bg-[#19aa59]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Terminal className="h-5 w-5 text-[#19aa59]" />
                </div>
                <div>
                  <div className="text-white font-medium">Interactive Terminal</div>
                  <div className="text-sm text-gray-400">Execute real SQL queries instantly</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium">Structured Learning</div>
                  <div className="text-sm text-gray-400">From basics to advanced concepts</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-white font-medium">Earn Achievements</div>
                  <div className="text-sm text-gray-400">Compete on leaderboards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <ContactForm onClose={() => setShowContactForm(false)} userEmail={registerForm.email} />
      )}
    </div>
  );
}
