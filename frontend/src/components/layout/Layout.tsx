import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { BrandLink } from '@/components/branding/Brand'

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
      <BrandLink className="mb-8" iconClassName="h-9 w-9" textClassName="text-xl" />
      <Outlet />
    </div>
  )
}
