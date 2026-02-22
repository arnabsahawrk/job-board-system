import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/30 dark:from-surface-950 dark:via-primary-950/10 dark:to-indigo-950/10 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </div>
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} Jobly. All rights reserved.
      </footer>
    </div>
  )
}
