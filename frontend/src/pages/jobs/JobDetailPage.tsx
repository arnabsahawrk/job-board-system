import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Briefcase, Users, Calendar, Clock,
  ArrowLeft, Edit, Trash2, Star, FileText, ExternalLink, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLoader } from '@/components/common/LoadingSpinner'
import { jobsApi } from '@/api/jobs'
import { applicationsApi } from '@/api/applications'
import { reviewsApi } from '@/api/reviews'
import { useAuth } from '@/context/AuthContext'
import { extractErrorMessage, formatSalary, formatDate, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import type { JobDetail, ReviewListItem } from '@/types'
import { CompanyLogoFallback } from '@/components/branding/Brand'

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', remote: 'Remote', contract: 'Contract', internship: 'Internship',
}
const CATEGORY_LABELS: Record<string, string> = {
  it: 'Technology', healthcare: 'Healthcare', finance: 'Finance', education: 'Education',
  marketing: 'Marketing', design: 'Design', other: 'Other',
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return
      setLoading(true)
      try {
        setErrorMessage(null)
        const [jobRes, reviewsRes] = await Promise.all([
          jobsApi.get(parseInt(id)),
          reviewsApi.jobReviews(parseInt(id)).catch(() => ({ data: [] })),
        ])
        setJob(jobRes.data)
        setReviews(reviewsRes.data)
        // Check if already applied
        if (user?.role === 'seeker') {
          try {
            const appsRes = await applicationsApi.myApplications()
            const applied = appsRes.data.some(a => a.job === parseInt(id))
            setHasApplied(applied)
          } catch { /* ignore */ }
        }
      } catch (err) {
        const message = extractErrorMessage(err)
        setErrorMessage(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id, user, navigate])

  const handleApply = async () => {
    if (!job) return
    if (!resumeFile) {
      toast.error('Please attach your resume before submitting.')
      return
    }
    setApplying(true)
    try {
      const formData = new FormData()
      formData.append('job_id', String(job.id))
      if (coverLetter) formData.append('cover_letter', coverLetter)
      formData.append('resume', resumeFile)
      await applicationsApi.create(formData)
      toast.success('Application submitted successfully!')
      setApplyOpen(false)
      setHasApplied(true)
      setCoverLetter('')
      setResumeFile(null)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setApplying(false)
    }
  }

  const handleDelete = async () => {
    if (!job) return
    setDeleting(true)
    try {
      await jobsApi.delete(job.id)
      toast.success('Job deleted')
      navigate('/my-jobs')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const isOwner = user?.role === 'recruiter' && job?.recruiter_email === user.email
  const isSeeker = user?.role === 'seeker'

  if (loading) return <PageLoader />
  if (!job) {
    return (
      <div className="container py-12">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8 text-center space-y-3">
            <h1 className="text-xl font-semibold">Unable to load this job</h1>
            <p className="text-sm text-muted-foreground">
              {errorMessage || 'This job may have been removed or is not available right now.'}
            </p>
            <Button asChild>
              <Link to="/jobs">Back to jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link to="/jobs"><ArrowLeft className="h-4 w-4 mr-1" /> Back to jobs</Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-background overflow-hidden">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} className="h-full w-full object-cover" />
                  ) : (
                    <CompanyLogoFallback className="h-8 w-8" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold font-display mb-1">{job.title}</h1>
                  <p className="text-muted-foreground">{job.company_name}</p>
                  <p className="text-sm text-muted-foreground">{timeAgo(job.created_at)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                <Badge variant="outline">{CATEGORY_LABELS[job.category] || job.category}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {job.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                )}
                {job.salary && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>{formatSalary(job.salary)}</span>
                  </div>
                )}
                {job.experience_required > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4 shrink-0" />
                    <span>{job.experience_required}+ yrs exp</span>
                  </div>
                )}
                {job.position_count > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{job.position_count} positions</span>
                  </div>
                )}
                {job.application_deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Deadline: {formatDate(job.application_deadline)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardHeader><CardTitle className="text-base">Requirements</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.requirements}</p>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.slice(0, 3).map(review => (
                  <div key={review.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{review.reviewer_name}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</p>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply card */}
          <Card>
            <CardContent className="p-5 space-y-3">
              {!user ? (
                <>
                  <p className="text-sm text-muted-foreground text-center mb-3">Sign in to apply for this position</p>
                  <Button className="w-full" asChild><Link to="/login">Sign In to Apply</Link></Button>
                </>
              ) : isSeeker ? (
                hasApplied ? (
                  <div className="text-center space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-sm font-medium">Already applied</p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to="/applications">View Applications</Link>
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => setApplyOpen(true)}>
                    Apply Now
                  </Button>
                )
              ) : isOwner ? (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/jobs/${job.id}/edit`}><Edit className="h-4 w-4 mr-2" />Edit Job</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/jobs/${job.id}/applications`}><Users className="h-4 w-4 mr-2" />View Applications</Link>
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />Delete Job
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Job info */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-sm">Job Details</h3>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posted</span>
                  <span>{formatDate(job.created_at)}</span>
                </div>
                {job.application_deadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span>{formatDate(job.application_deadline)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{JOB_TYPE_LABELS[job.job_type]}</span>
                </div>
                {job.experience_required > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience</span>
                    <span>{job.experience_required}+ years</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground text-xs">Recruiter</p>
                <p className="font-medium">{job.recruiter_name}</p>
                <a href={`mailto:${job.recruiter_email}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                  {job.recruiter_email} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {job.title}</DialogTitle>
            <DialogDescription>{job.company_name} · {job.location}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cover_letter">Cover Letter (optional)</Label>
              <Textarea
                id="cover_letter"
                placeholder="Briefly introduce yourself and why you're a great fit..."
                className="mt-1.5 min-h-[120px]"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="resume">Resume (required)</Label>
              <div className="mt-1.5">
                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-3 file:rounded-md file:border file:border-input file:text-sm file:font-medium file:bg-background hover:file:bg-accent cursor-pointer"
                  onChange={e => setResumeFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">PDF or Word document, up to 5MB.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)} disabled={applying}>Cancel</Button>
            <Button onClick={handleApply} disabled={applying}>
              {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete job posting?</DialogTitle>
            <DialogDescription>This will permanently delete "{job.title}" and all associated applications. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
