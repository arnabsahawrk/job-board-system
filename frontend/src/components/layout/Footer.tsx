export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 Jobly. Built by Arnab Saha.</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-green-500 inline-block" />
            Powered by Django REST Framework
          </span>
        </div>
      </div>
    </footer>
  )
}
