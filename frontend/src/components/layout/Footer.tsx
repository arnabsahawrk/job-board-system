import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-surface-950 mt-auto">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold font-display text-lg text-slate-900 dark:text-white">
              <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold">J</div>
              Jobly
            </Link>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Connecting exceptional talent with world-class opportunities.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-3">For Job Seekers</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/jobs" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Browse Jobs</Link></li>
              <li><Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Create Account</Link></li>
              <li><Link to="/my-applications" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">My Applications</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-3">For Recruiters</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/post-job" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Post a Job</Link></li>
              <li><Link to="/my-jobs" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Manage Jobs</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {year} Jobly. Built by Arnab Saha.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Powered by Django REST Framework
          </p>
        </div>
      </div>
    </footer>
  )
}
