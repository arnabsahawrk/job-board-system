import { reviewsApi } from "@/api/reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import type { TopRecruiter } from "@/types";
import {
  BookOpen,
  Building,
  CheckCircle2,
  Code2,
  Globe,
  Heart,
  Palette,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─── Static data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    label: "Technology",
    value: "it",
    icon: Code2,
    cls: "bg-blue-50   text-blue-600   dark:bg-blue-950/60  dark:text-blue-400",
  },
  {
    label: "Healthcare",
    value: "healthcare",
    icon: Heart,
    cls: "bg-rose-50   text-rose-600   dark:bg-rose-950/60  dark:text-rose-400",
  },
  {
    label: "Finance",
    value: "finance",
    icon: TrendingUp,
    cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  {
    label: "Education",
    value: "education",
    icon: BookOpen,
    cls: "bg-amber-50  text-amber-600  dark:bg-amber-950/60 dark:text-amber-400",
  },
  {
    label: "Marketing",
    value: "marketing",
    icon: Globe,
    cls: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
  },
  {
    label: "Design",
    value: "design",
    icon: Palette,
    cls: "bg-pink-50   text-pink-600   dark:bg-pink-950/60  dark:text-pink-400",
  },
  {
    label: "Business",
    value: "other",
    icon: Building,
    cls: "bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
  },
];

const POPULAR_FILTERS = [
  { label: "Remote", params: "?job_type=remote" },
  { label: "Full-time", params: "?job_type=full_time" },
  { label: "Tech", params: "?category=it" },
  { label: "Design", params: "?category=design" },
  { label: "Finance", params: "?category=finance" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create your profile",
    desc: "Sign up and build a profile that showcases your skills and experience.",
  },
  {
    step: "02",
    title: "Discover openings",
    desc: "Explore listings across every industry, filtered to what matters to you.",
  },
  {
    step: "03",
    title: "Apply in seconds",
    desc: "Submit your application with your saved resume and cover letter.",
  },
  {
    step: "04",
    title: "Get hired",
    desc: "Track your applications and connect with top employers in Bangladesh.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time listings",
    desc: "Jobs updated the moment they're posted by verified employers.",
  },
  {
    icon: Shield,
    title: "Verified employers",
    desc: "Every recruiter account is reviewed before posting.",
  },
  {
    icon: Star,
    title: "Employer ratings",
    desc: "Honest reviews from past applicants before you apply.",
  },
  {
    icon: CheckCircle2,
    title: "Application tracker",
    desc: "See every status change — from pending to offer.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [topRecruiters, setTopRecruiters] = useState<TopRecruiter[]>([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reviewsApi
      .topRecruiters(3)
      .then((recruitersRes) => {
        setTopRecruiters(recruitersRes.data);
      })
      .catch(() => {})
      .finally(() => setLoadingRecruiters(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <div className="flex flex-col">
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/[0.06] via-background to-background">
        {/* Subtle grid decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container relative py-20 md:py-28 lg:py-36">
          <div className="mx-auto max-w-2xl text-center">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6 animate-fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Hiring platform & beyond
            </div>

            {/* Heading */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5 animate-slide-up"
              style={{ animationDelay: "60ms" }}
            >
              Find the job you <span className="gradient-text">deserve</span>
            </h1>

            {/* Sub-copy */}
            <p
              className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              Curated listings from verified employers. Apply in seconds, track every step — all in
              one place.
            </p>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2.5 max-w-lg mx-auto animate-slide-up"
              style={{ animationDelay: "140ms" }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Job title, skill, or keyword…"
                  className="pl-10 h-11 shadow-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-11 px-6 shadow-sm shrink-0">
                Search
              </Button>
            </form>

            {/* Popular pills */}
            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-2 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <span className="text-xs text-muted-foreground font-medium">Popular:</span>
              {POPULAR_FILTERS.map((f) => (
                <Link
                  key={f.label}
                  to={`/jobs${f.params}`}
                  className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Browse by industry</h2>
            <p className="text-sm text-muted-foreground">Find roles across every sector</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.value}
                  to={`/jobs?category=${cat.value}`}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${cat.cls} transition-transform duration-200 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-center leading-snug text-foreground/80 group-hover:text-primary transition-colors">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How Jobly Works</h2>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              A simple path to your next opportunity
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border/60 bg-background p-6 transition-all hover:shadow-md hover:-translate-y-1"
              >
                {/* Step Circle */}
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-semibold mb-5 text-sm">
                  {item.step}
                </div>

                <h3 className="font-semibold text-base mb-2">{item.title}</h3>

                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Why choose Jobly</h2>
            <p className="text-sm text-muted-foreground">Everything you need, nothing you don't</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-background rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Icon
                      className="h-4.5 w-4.5 text-primary"
                      style={{ height: "18px", width: "18px" }}
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Top Recruiters ──────────────────────────────────────────────── */}
      {(loadingRecruiters || topRecruiters.length > 0) && (
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Top-rated employers</h2>
              <p className="text-sm text-muted-foreground">
                Recruiters with the highest community ratings
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 max-w-xl mx-auto">
              {loadingRecruiters
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="text-center">
                      <CardContent className="pt-6 pb-5 space-y-2">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted animate-pulse" />
                        <div className="h-4 w-3/4 mx-auto rounded bg-muted animate-pulse" />
                        <div className="h-3 w-1/2 mx-auto rounded bg-muted animate-pulse" />
                      </CardContent>
                    </Card>
                  ))
                : topRecruiters.map((r, i) => (
                    <Card key={i} className="text-center hover:border-primary/30 transition-colors">
                      <CardContent className="pt-6 pb-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-semibold text-sm mb-1 truncate">{r.recruiter__full_name}</p>
                        <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-sm font-semibold">
                            {Number(r.avg_rating).toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.review_count} review{r.review_count !== 1 ? "s" : ""}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-lg">
            {/* subtle overlay */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Take the next step in your career
              </h2>

              <p className="text-primary-foreground/80 text-sm md:text-base mb-10">
                Discover verified opportunities across Bangladesh and grow professionally with
                Jobly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Not Logged In */}
                {!user && (
                  <>
                    <Button
                      size="lg"
                      className="bg-background text-primary hover:bg-background/90 font-semibold shadow-sm"
                      asChild
                    >
                      <Link to="/register">Create Free Account</Link>
                    </Button>

                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                      asChild
                    >
                      <Link to="/jobs">Browse Jobs</Link>
                    </Button>
                  </>
                )}

                {/* Logged In – Seeker */}
                {user?.role === "seeker" && (
                  <>
                    <Button
                      size="lg"
                      className="bg-background text-primary hover:bg-background/90 font-semibold shadow-sm"
                      asChild
                    >
                      <Link to="/jobs">Browse Jobs</Link>
                    </Button>

                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                      asChild
                    >
                      <Link to="/applications">View Applications</Link>
                    </Button>
                  </>
                )}

                {/* Logged In – Recruiter */}
                {user?.role === "recruiter" && (
                  <>
                    <Button
                      size="lg"
                      className="bg-background text-primary hover:bg-background/90 font-semibold shadow-sm"
                      asChild
                    >
                      <Link to="/jobs/post">Post a Job</Link>
                    </Button>

                    <Button
                      size="lg"
                      variant="secondary"
                      className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                      asChild
                    >
                      <Link to="/dashboard">Go to Dashboard</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
