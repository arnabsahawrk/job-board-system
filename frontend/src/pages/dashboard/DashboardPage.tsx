import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Briefcase, Star, Clock, CheckCircle2, XCircle, ArrowRight, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { applicationsApi } from '@/api/applications'
import { jobsApi } from '@/api/jobs'
import { reviewsApi } from '@/api/reviews'
import type { StatusSummary, JobListItem, ReviewListItem, ApplicationListItem } from '@/types'
import { extractErrorMessage, timeAgo } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'pending' }> = {
  pending: { label: 'Pending', variant: 'pending' },
  reviewed: { label: 'Reviewed', variant: 'info' as 'default' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isSeeker = user?.role === 'seeker'
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Seeker data
  const [statusSummary, setStatusSummary] = useState<StatusSummary | null>(null)
  const [recentApplications, setRecentApplications] = useState<ApplicationListItem[]>([])
  const [myReviews, setMyReviews] = useState<ReviewListItem[]>([])

  // Recruiter data
  const [myJobs, setMyJobs] = useState<JobListItem[]>([])
  const [recentApps, setRecentApps] = useState<ApplicationListItem[]>([])
  const [receivedReviews, setReceivedReviews] = useState<ReviewListItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        setErrorMessage(null)
        if (isSeeker) {
          const [summaryRes, appsRes, reviewsRes] = await Promise.all([
            applicationsApi.statusSummary(),
            applicationsApi.myApplications(),
            reviewsApi.myReviews(),
          ])
          setStatusSummary(summaryRes.data)
          setRecentApplications(appsRes.data.slice(0, 5))
          setMyReviews(reviewsRes.data.slice(0, 3))
        } else {
          const [jobsRes, appsRes, reviewsRes] = await Promise.all([
            jobsApi.myJobs(),
            applicationsApi.jobApplications(),
            reviewsApi.myReceivedReviews(),
          ])
          setMyJobs(jobsRes.data)
          setRecentApps(appsRes.data.slice(0, 5))
          setReceivedReviews(reviewsRes.data.slice(0, 3))
        }
      } catch (err) {
        setErrorMessage(extractErrorMessage(err))
      }
      finally { setLoading(false) }
    }
    fetchData()
  }, [isSeeker])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display">{greeting}, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{isSeeker ? 'Track your job search progress' : 'Manage your postings and applications'}</p>
        </div>
        {isSeeker ? (
          <Button asChild><Link to="/jobs">Browse Jobs <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        ) : (
          <Button asChild><Link to="/jobs/post"><PlusCircle className="mr-2 h-4 w-4" />Post New Job</Link></Button>
        )}
      </div>

      {/* Stats */}
      {errorMessage && !loading && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {isSeeker ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-4 w-20" /></CardContent></Card>
            ))
          ) : statusSummary ? (
            <>
              <StatCard icon={FileText} label="Total Applied" value={statusSummary.total} color="text-blue-500" />
              <StatCard icon={Clock} label="Pending" value={statusSummary.pending} color="text-orange-500" />
              <StatCard icon={CheckCircle2} label="Accepted" value={statusSummary.accepted} color="text-green-500" />
              <StatCard icon={XCircle} label="Rejected" value={statusSummary.rejected} color="text-red-500" />
            </>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-4 w-20" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatCard icon={Briefcase} label="Active Jobs" value={myJobs.length} color="text-blue-500" />
              <StatCard icon={FileText} label="Applications" value={recentApps.length} color="text-purple-500" />
              <StatCard icon={Star} label="Reviews" value={receivedReviews.length} color="text-yellow-500" />
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{isSeeker ? 'Recent Applications' : 'Recent Applications Received'}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to={isSeeker ? '/applications' : '/my-jobs'}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (isSeeker ? recentApplications : recentApps).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No applications yet</p>
            ) : (
              <div className="divide-y">
                {(isSeeker ? recentApplications : recentApps).map(app => (
                  <div key={app.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{app.job_title}</p>
                      <p className="text-xs text-muted-foreground">{isSeeker ? app.job_company : app.applicant_name} · {timeAgo(app.applied_at)}</p>
                    </div>
                    <Badge variant={STATUS_CONFIG[app.status]?.variant || 'secondary'} className="shrink-0 ml-2">
                      {STATUS_CONFIG[app.status]?.label || app.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secondary card */}
        {isSeeker ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">My Reviews</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/reviews">View all</Link></Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                : myReviews.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                    <Button variant="outline" size="sm" asChild><Link to="/applications">Write a review</Link></Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {myReviews.map(r => (
                      <div key={r.id} className="py-3 first:pt-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{r.job_title}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.recruiter_name} · {timeAgo(r.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">My Job Listings</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/my-jobs">View all</Link></Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                : myJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-3">No jobs posted yet</p>
                    <Button asChild size="sm"><Link to="/jobs/post">Post a Job</Link></Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {myJobs.slice(0, 5).map(job => (
                      <Link key={job.id} to={`/jobs/${job.id}/applications`} className="flex items-center justify-between py-3 first:pt-0 hover:text-primary transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(job.created_at)}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-2xl font-bold font-display">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}
