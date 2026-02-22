import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Edit, Users, Trash2, Building2, Loader2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { jobsApi } from '@/api/jobs'
import type { JobListItem } from '@/types'
import { extractErrorMessage, timeAgo, formatSalary } from '@/lib/utils'
import { toast } from 'sonner'

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time', remote: 'Remote', contract: 'Contract', internship: 'Internship',
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    jobsApi.myJobs()
      .then(res => setJobs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await jobsApi.delete(deleteId)
      setJobs(prev => prev.filter(j => j.id !== deleteId))
      toast.success('Job deleted')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display">My Job Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">{jobs.length} active posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild><Link to="/jobs/post"><PlusCircle className="h-4 w-4 mr-2" />Post New Job</Link></Button>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Create your first job listing to start receiving applications."
          action={<Button asChild><Link to="/jobs/post"><PlusCircle className="h-4 w-4 mr-2" />Post a Job</Link></Button>}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <Card key={job.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-background overflow-hidden">
                    {job.company_logo ? (
                      <img src={job.company_logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <Link to={`/jobs/${job.id}`} className="font-semibold hover:text-primary transition-colors truncate">{job.title}</Link>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                      <span>{job.location}</span>
                      {job.salary && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatSalary(job.salary)}</span>}
                      <span>Posted {timeAgo(job.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/jobs/${job.id}/edit`}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/jobs/${job.id}/applications`}><Users className="h-3.5 w-3.5 mr-1" />Applications</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(job.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete job listing?</DialogTitle>
            <DialogDescription>This will permanently remove the job and all associated applications. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

