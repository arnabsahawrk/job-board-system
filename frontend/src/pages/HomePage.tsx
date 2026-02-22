import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Code2,
  DollarSign,
  GraduationCap,
  Heart,
  LineChart,
  Megaphone,
  Palette,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { jobsApi } from '../api/jobs'
import { reviewsApi } from '../api/reviews'
import type { JobListItem, TopRecruiter } from '../types'
import JobCard from '../components/common/JobCard'
import { JobCardSkeleton } from '../components/common/SkeletonCard'
import { JOB_CATEGORY_LABELS, formatDate } from '../utils/helpers'

const CATEGORIES = [
  { key: 'it', label: 'Technology', icon: Code2, color: 'from-blue-500 to-cyan-500', count: '2,400+' },
  { key: 'healthcare', label: 'Healthcare', icon: Heart, color: 'from-rose-500 to-pink-500', count: '1,200+' },
  { key: 'finance', label: 'Finance', icon: DollarSign, color: 'from-emerald-500 to-teal-500', count: '890+' },
  { key: 'education', label: 'Education', icon: GraduationCap, color: 'from-amber-500 to-orange-500', count: '640+' },
  { key: 'marketing', label: 'Marketing', icon: Megaphone, color: 'from-violet-500 to-purple-500', count: '750+' },
  { key: 'design', label: 'Design', icon: Palette, color: 'from-fuchsia-500 to-pink-500', count: '480+' },
]

const FEATURES = [
  { icon: Zap, title: 'Apply in Seconds', desc: 'Upload your resume once and apply to any job with a single click.' },
  { icon: Shield, title: 'Verified Companies', desc: 'All companies are vetted and verified before posting jobs on Jobly.' },
  { icon: TrendingUp, title: 'Career Insights', desc: 'Track your application status in real-time with detailed analytics.' },
  { icon: Users, title: 'Recruiter Network', desc: 'Connect directly with top recruiters from world-class companies.' },
]

const STEPS = [
  { num: '01', title: 'Create your profile', desc: 'Build a compelling profile with your skills, experience, and resume.' },
  { num: '02', title: 'Discover opportunities', desc: 'Browse thousands of curated job listings matching your expertise.' },
  { num: '03', title: 'Apply & connect', desc: 'Submit tailored applications and connect directly with hiring managers.' },
  { num: '04', title: 'Land your dream role', desc: 'Receive offers and start your next chapter with confidence.' },
]

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<JobListItem[]>([])
  const [topRecruiters, setTopRecruiters] = useState<TopRecruiter[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, recruitersRes] = await Promise.all([
          jobsApi.list({ page_size: 6 }),
          reviewsApi.topRecruiters(6),
        ])
        setFeaturedJobs(jobsRes.data.results)
        setTopRecruiters(recruitersRes.data)
      } catch {
        // silent fail on homepage
      } finally {
        setJobsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-50 via-white to-primary-50/40 dark:from-surface-950 dark:via-surface-900 dark:to-primary-950/20 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        {/* Glow blobs */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-400/10 dark:bg-primary-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-3xl" />

        <div className="section-container relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-800/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              10,000+ active job listings
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-slate-900 dark:text-white leading-tight animate-slide-up">
              Find Your{' '}
              <span className="text-gradient">Dream Career</span>
              <br />
              with Jobly
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Connect with top companies, discover opportunities tailored to your skills, and take the next step in your professional journey.
            </p>

            {/* Search bar */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Job title, keyword, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/jobs?search=${encodeURIComponent(searchQuery)}`
                    }
                  }}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 shadow-sm text-base"
                />
              </div>
              <Link
                to={searchQuery ? `/jobs?search=${encodeURIComponent(searchQuery)}` : '/jobs'}
                className="btn-primary px-8 py-4 text-base rounded-2xl"
              >
                Search Jobs
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="text-sm text-slate-400">Popular:</span>
              {['Remote', 'Full-time', 'Tech', 'Design', 'Finance'].map((tag) => (
                <Link
                  key={tag}
                  to={`/jobs?search=${tag.toLowerCase()}`}
                  className="px-3 py-1 rounded-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { num: '10K+', label: 'Active Jobs' },
                { num: '5K+', label: 'Companies' },
                { num: '50K+', label: 'Hires Made' },
              ].map(({ num, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">{num}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-surface-950">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white">
              Browse by Category
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Explore opportunities across industries
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(({ key, label, icon: Icon, color, count }) => (
              <Link
                key={key}
                to={`/jobs?category=${key}`}
                className="group card-hover p-5 text-center cursor-pointer"
              >
                <div className={`mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 font-display">{label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{count} jobs</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Jobs ─────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/50 dark:bg-surface-900/50">
        <div className="section-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white">
                Latest Opportunities
              </h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Fresh jobs posted recently</p>
            </div>
            <Link to="/jobs" className="btn-outline hidden sm:flex">
              View All Jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {jobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : featuredJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">No jobs available at the moment.</div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/jobs" className="btn-outline">
              View All Jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it Works ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-surface-950">
        <div className="section-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white">
              Your Journey to Success
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Four simple steps to land the job you've always wanted
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-primary-300 to-transparent dark:from-primary-800" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold font-mono shadow-glow mb-5">
                    {num}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white font-display mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="section-container relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Why Choose Jobly?
            </h2>
            <p className="mt-3 text-primary-100 max-w-xl mx-auto">
              Everything you need to accelerate your career
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white font-display mb-2">{title}</h3>
                <p className="text-sm text-primary-100 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Top Recruiters ────────────────────────────────────────────── */}
      {topRecruiters.length > 0 && (
        <section className="py-20 bg-white dark:bg-surface-950">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white">
                Top-Rated Recruiters
              </h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                Hiring professionals with exceptional candidate reviews
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRecruiters.map((recruiter) => (
                <div key={recruiter.recruiter} className="card-hover p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold font-display text-lg flex-shrink-0">
                      {recruiter.recruiter__full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate font-display">
                        {recruiter.recruiter__full_name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < Math.round(recruiter.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {recruiter.avg_rating.toFixed(1)} ({recruiter.review_count})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-surface-900">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold font-display text-slate-900 dark:text-white mb-6">
              Ready to take the<br />
              <span className="text-gradient">next big step?</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10">
              Join thousands of professionals who found their dream jobs through Jobly. Your future starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary px-8 py-4 text-base rounded-2xl justify-center">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/jobs" className="btn-outline px-8 py-4 text-base rounded-2xl justify-center">
                Browse Jobs
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              No credit card required · Free to join
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
