import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main key={location.pathname} className="flex-1 animate-in-page">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4 py-16">
      {/* Logo at top of auth forms */}
      <a href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
          <span className="font-display font-bold text-lg text-primary-foreground leading-none">J</span>
        </div>
        <span className="font-display font-bold text-xl">Jobly</span>
      </a>
      <Outlet />
    </div>
  )
}
