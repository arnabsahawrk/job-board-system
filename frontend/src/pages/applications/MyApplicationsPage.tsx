import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ExternalLink, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/common/EmptyState'
import { applicationsApi } from '@/api/applications'
import type { ApplicationListItem, ApplicationFeedback } from '@/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/lib/utils'

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', variant: 'pending' as const, desc: 'Your application is waiting to be reviewed' },
  reviewed: { label: 'Under Review', variant: 'info' as 'default', desc: 'The recruiter is reviewing your application' },
  accepted: { label: 'Accepted 🎉', variant: 'success' as const, desc: 'Congratulations! Your application was accepted' },
  rejected: { label: 'Not Selected', variant: 'destructive' as const, desc: 'Unfortunately this application was not selected' },
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<ApplicationFeedback | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    applicationsApi.myApplications()
      .then(res => {
        setErrorMessage(null)
        setApplications(res.data)
      })
      .catch((err) => setErrorMessage(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const viewFeedback = async (id: number) => {
    setLoadingFeedback(true)
    setFeedbackOpen(true)
    try {
      const res = await applicationsApi.feedback(id)
      setFeedback(res.data)
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setFeedbackOpen(false)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const deleteApplication = async (id: number) => {
    setDeletingId(id)
    try {
      await applicationsApi.delete(id)
      setApplications((prev) => prev.filter((application) => application.id !== id))
      toast.success('Application removed')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  // Group by status for summary
  const summary = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">My Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">{applications.length} total applications</p>
        </div>
        <Button asChild variant="outline"><Link to="/jobs">Browse more jobs</Link></Button>
      </div>

      {/* Status summary */}
      {!loading && applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Card key={key} className="text-center">
              <CardContent className="py-3 px-4">
                <p className="text-xl font-bold">{summary[key] || 0}</p>
                <Badge variant={cfg.variant} className="text-xs mt-1">{cfg.label.replace(' 🎉', '')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Start applying to jobs you're interested in"
          action={<Button asChild><Link to="/jobs">Browse Jobs</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
            return (
              <Card key={app.id} className={app.status === 'accepted' ? 'border-green-500/50 bg-green-50/30 dark:bg-green-900/10' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link to={`/jobs/${app.job}`} className="text-sm font-semibold hover:text-primary transition-colors truncate block">
                            {app.job_title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{app.job_company} · Applied {formatDate(app.applied_at)}</p>
                        </div>
                        <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{cfg.desc}</p>
                    </div>
                  </div>

                  {(app.status === 'accepted' || app.status === 'rejected') && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewFeedback(app.id)}>
                        <MessageSquare className="h-3 w-3 mr-1" /> View Feedback
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/jobs/${app.job}`}><ExternalLink className="h-3 w-3 mr-1" /> View Job</Link>
                      </Button>
                    </div>
                  )}
                  {(app.status === 'pending' || app.status === 'reviewed') && (
                    <div className="mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deletingId === app.id}
                        onClick={() => deleteApplication(app.id)}
                      >
                        {deletingId === app.id ? (
                          'Removing...'
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Withdraw
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Feedback</DialogTitle>
          </DialogHeader>
          {loadingFeedback ? (
            <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-16 w-full" /></div>
          ) : feedback ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">{feedback.job_title}</p>
                <Badge variant={feedback.status_given === 'accepted' ? 'success' : 'destructive'} className="text-xs">
                  {feedback.status_given === 'accepted' ? 'Accepted' : 'Not Selected'}
                </Badge>
              </div>
              {feedback.feedback_text && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Recruiter's message</p>
                  <p className="text-sm bg-muted rounded-md p-3">{feedback.feedback_text}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">From: {feedback.recruiter_name}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No feedback available</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
