import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  title?: string
}

export function BrandMark({ className, title = 'Jobly' }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex', className)} aria-label={title}>
      <svg viewBox="0 0 64 64" role="img" aria-hidden="true" className="h-full w-full">
        <rect width="64" height="64" rx="16" fill="#4F46E5" />
        <path
          d="M39.5 15.5V38.8C39.5 48.2 33.6 53 25.4 53C20.2 53 16.3 51.2 13 47.8L18.4 42.2C20.3 44.2 22.2 45.4 25.1 45.4C29.1 45.4 31.5 43 31.5 38.6V15.5H39.5Z"
          fill="white"
        />
      </svg>
    </span>
  )
}

interface BrandLinkProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
  to?: string
}

export function BrandLink({
  className,
  iconClassName,
  textClassName,
  showText = true,
  to = '/',
}: BrandLinkProps) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2', className)}>
      <BrandMark className={cn('h-8 w-8', iconClassName)} />
      {showText && (
        <span className={cn('font-display text-lg font-bold tracking-tight', textClassName)}>
          Jobly
        </span>
      )}
    </Link>
  )
}

export function CompanyLogoFallback({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-7 w-7', className)} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="hsl(var(--muted))" />
      <rect x="10" y="36" width="44" height="18" rx="4" fill="hsl(var(--accent))" />
      <rect x="14" y="20" width="14" height="16" rx="2" fill="hsl(var(--primary))" />
      <rect x="31" y="14" width="10" height="22" rx="2" fill="hsl(var(--primary) / 0.85)" />
      <rect x="44" y="24" width="6" height="12" rx="1.5" fill="hsl(var(--primary) / 0.65)" />
      <path d="M18 42H46" stroke="hsl(var(--border))" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 48H24M30 48H32M38 48H40" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
