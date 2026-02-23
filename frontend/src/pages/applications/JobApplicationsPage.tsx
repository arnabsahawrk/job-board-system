import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, User, Loader2, ExternalLink, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { applicationsApi } from '@/api/applications'
import type { ApplicationListItem, ApplicationDetail, ApplicationStatus, User as UserType } from '@/types'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]
const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'secondary' | 'pending'> = {
  pending: 'pending', reviewed: 'secondary', accepted: 'success', rejected: 'destructive',
}

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>()
  const [applications, setApplications] = useState<ApplicationListItem[]>([])
  const [filtered, setFiltered] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null)
  const [applicantProfile, setApplicantProfile] = useState<UserType | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [statusUpdate, setStatusUpdate] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const jobId = id ? parseInt(id) : undefined
    applicationsApi.jobApplications(jobId)
      .then(res => {
        setErrorMessage(null)
        setApplications(res.data)
        setFiltered(res.data)
      })
      .catch((err) => setErrorMessage(extractErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    let result = applications
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a => a.applicant_name.toLowerCase().includes(q) || a.applicant_email.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter)
    setFiltered(result)
  }, [searchQuery, statusFilter, applications])

  const openDetail = async (app: ApplicationListItem) => {
    setDetailOpen(true)
    setLoadingDetail(true)
    setSelectedApp(null)
    setApplicantProfile(null)
    try {
      const [detailRes, profileRes] = await Promise.all([
        applicationsApi.get(app.id),
        applicationsApi.applicantProfile(app.id),
      ])
      setSelectedApp(detailRes.data)
      setApplicantProfile(profileRes.data)
      setStatusUpdate(detailRes.data.status)
      setFeedbackText('')
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setDetailOpen(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedApp) return
    const trimmedFeedback = feedbackText.trim()
    if (statusUpdate === selectedApp.status && !trimmedFeedback) {
      toast.error('No changes to save.')
      return
    }
    setUpdating(true)
    try {
      if (trimmedFeedback) {
        await applicationsApi.updateStatusWithFeedback(selectedApp.id, {
          status: statusUpdate as ApplicationStatus,
          feedback_text: trimmedFeedback,
        })
      } else {
        await applicationsApi.update(selectedApp.id, { status: statusUpdate as ApplicationStatus })
      }
      toast.success('Application status updated')
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, status: statusUpdate as ApplicationListItem['status'] } : a))
      setDetailOpen(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="container py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/my-jobs"><ArrowLeft className="h-4 w-4 mr-1" /> Back to My Jobs</Link>
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">{id ? 'Job Applications' : 'All Applications'}</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} applicant{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={User} title="No applications found" description="No applicants match your filter criteria." />
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <Card key={app.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openDetail(app)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs">{initials(app.applicant_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{app.applicant_name}</p>
                      <Badge variant={STATUS_VARIANTS[app.status] || 'secondary'} className="shrink-0 text-xs capitalize">
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{app.applicant_email}</p>
                    {!id && <p className="text-xs text-muted-foreground mt-0.5">For: {app.job_title}</p>}
                    <p className="text-xs text-muted-foreground">Applied {formatDate(app.applied_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            {selectedApp && <DialogDescription>For: {selectedApp.job.title}</DialogDescription>}
          </DialogHeader>
          {loadingDetail ? (
            <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-32 w-full" /></div>
          ) : selectedApp && (
            <div className="space-y-4">
              {/* Applicant info */}
              <div className="flex items-center gap-3">
                <Avatar><AvatarFallback>{initials(selectedApp.applicant_name)}</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold">{selectedApp.applicant_name}</p>
                  <a href={`mailto:${selectedApp.applicant_email}`} className="text-xs text-primary hover:underline">{selectedApp.applicant_email}</a>
                  {selectedApp.applicant_phone && <p className="text-xs text-muted-foreground">{selectedApp.applicant_phone}</p>}
                </div>
              </div>

              {applicantProfile?.profile?.bio && (
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Bio</p><p className="text-sm">{applicantProfile.profile.bio}</p></div>
              )}
              {applicantProfile?.profile?.skills && (
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Skills</p><p className="text-sm">{applicantProfile.profile.skills}</p></div>
              )}
              {selectedApp.cover_letter && (
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Cover Letter</p>
                  <p className="text-sm bg-muted rounded-md p-3 whitespace-pre-wrap">{selectedApp.cover_letter}</p>
                </div>
              )}
              {selectedApp.resume && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedApp.resume} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-2" />View Resume</a>
                </Button>
              )}

              {/* Status update */}
              <div className="border-t pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>Update Status</Label>
                  <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Feedback Message</Label>
                  <Textarea placeholder="Optional message for the applicant..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={updating || loadingDetail}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
