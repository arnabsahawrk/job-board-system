import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, FileText, Star, PlusCircle, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      to={href}
      className={cn(
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        location.pathname === href || location.pathname.startsWith(href + '/')
          ? 'text-foreground bg-accent'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
      )}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container flex h-14 items-center gap-4">

        {/* ─── Logo ─── */}
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <span className="font-display font-bold text-base text-primary-foreground leading-none">J</span>
          </div>
          <span className="font-display font-bold text-lg hidden sm:block">Jobly</span>
        </Link>

        {/* ─── Desktop nav ─── */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {navLink('/jobs', 'Browse Jobs')}
          {user?.role === 'seeker'    && navLink('/applications', 'Applications')}
          {user?.role === 'recruiter' && navLink('/my-jobs', 'My Jobs')}
          {user?.role === 'recruiter' && navLink('/jobs/post', 'Post Job')}
        </nav>

        {/* ─── Right side ─── */}
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-lg">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.profile?.avatar ?? undefined} />
                    <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[110px] truncate">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="pb-2">
                  <p className="font-semibold text-sm">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">{user.email}</p>
                  <span className="inline-block text-[10px] font-medium uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5 mt-1.5">
                    {user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile"><User className="h-4 w-4" /> Profile Settings</Link>
                </DropdownMenuItem>

                {user.role === 'seeker' && (
                  <DropdownMenuItem asChild>
                    <Link to="/applications"><FileText className="h-4 w-4" /> My Applications</Link>
                  </DropdownMenuItem>
                )}
                {user.role === 'recruiter' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/my-jobs"><Briefcase className="h-4 w-4" /> My Jobs</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/jobs/post"><PlusCircle className="h-4 w-4" /> Post New Job</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/reviews"><Star className="h-4 w-4" /> Reviews</Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ─── Mobile nav drawer ─── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm">
          <nav className="container py-3 flex flex-col gap-0.5">
            <MobileLink to="/jobs" label="Browse Jobs" />
            {user?.role === 'seeker'    && <MobileLink to="/applications" label="My Applications" />}
            {user?.role === 'recruiter' && <MobileLink to="/my-jobs" label="My Jobs" />}
            {user?.role === 'recruiter' && <MobileLink to="/jobs/post" label="Post Job" />}
            {isAuthenticated && (
              <>
                <MobileLink to="/dashboard" label="Dashboard" />
                <MobileLink to="/profile" label="Profile" />
                <MobileLink to="/reviews" label="Reviews" />
                <div className="pt-2 mt-1 border-t border-border/60">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
            {!isAuthenticated && (
              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border/60">
                <Button variant="outline" size="sm" asChild><Link to="/login">Sign In</Link></Button>
                <Button size="sm" asChild><Link to="/register">Get Started</Link></Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function MobileLink({ to, label }: { to: string; label: string }) {
  const location = useLocation()
  return (
    <Link
      to={to}
      className={cn(
        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
        location.pathname === to ? 'text-foreground bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
      )}
    >
      {label}
    </Link>
  )
}
