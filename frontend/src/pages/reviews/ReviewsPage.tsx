import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Edit, Trash2, Loader2, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/EmptyState'
import { reviewsApi } from '@/api/reviews'
import { applicationsApi } from '@/api/applications'
import { useAuth } from '@/context/AuthContext'
import { extractErrorMessage, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import type { ApplicationListItem, ReviewListItem } from '@/types'

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = readonly ? i < value : i < (hovered || value)
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            className={readonly ? 'cursor-default' : 'cursor-pointer'}
            onMouseEnter={() => !readonly && setHovered(i + 1)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(i + 1)}
          >
            <Star className={`h-5 w-5 transition-colors ${filled ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
          </button>
        )
      })}
    </div>
  )
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const isSeeker = user?.role === 'seeker'
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [reviewableApplications, setReviewableApplications] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createJobId, setCreateJobId] = useState('')
  const [createRating, setCreateRating] = useState(5)
  const [createComment, setCreateComment] = useState('')
  const [creating, setCreating] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      setLoadError(null)
      const res = isSeeker ? await reviewsApi.myReviews() : await reviewsApi.myReceivedReviews()
      setReviews(res.data)
    } catch (err) {
      setLoadError(extractErrorMessage(err))
    }
    finally { setLoading(false) }
  }, [isSeeker])

  const fetchReviewableApplications = useCallback(async () => {
    if (!isSeeker) return
    try {
      const [appsRes, myReviewsRes] = await Promise.all([
        applicationsApi.myApplications(),
        reviewsApi.myReviews(),
      ])
      const reviewedJobIds = new Set(myReviewsRes.data.map((review) => review.job))
      const available = appsRes.data.filter((app) => !reviewedJobIds.has(app.job))
      setReviewableApplications(available)
      if (!createJobId && available.length > 0) {
        setCreateJobId(String(available[0].job))
      }
      if (available.length === 0) {
        setCreateJobId('')
      }
    } catch {
      setReviewableApplications([])
    }
  }, [createJobId, isSeeker])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    fetchReviewableApplications()
  }, [fetchReviewableApplications])

  const openEdit = async (reviewId: number) => {
    try {
      const { data } = await reviewsApi.get(reviewId)
      setEditId(data.id)
      setEditRating(data.rating)
      setEditComment(data.comment || '')
      setEditOpen(true)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleSave = async () => {
    if (!editId) return
    setSaving(true)
    try {
      await reviewsApi.update(editId, { rating: editRating, comment: editComment })
      toast.success('Review updated')
      setEditOpen(false)
      await fetchReviews()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!createJobId) {
      toast.error('Select a job to review.')
      return
    }
    setCreating(true)
    try {
      await reviewsApi.create({
        job_id: Number(createJobId),
        rating: createRating,
        comment: createComment.trim() || undefined,
      })
      toast.success('Review submitted')
      setCreateOpen(false)
      setCreateComment('')
      setCreateRating(5)
      await Promise.all([fetchReviews(), fetchReviewableApplications()])
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await reviewsApi.delete(deleteId)
      toast.success('Review deleted')
      setReviews(prev => prev.filter(r => r.id !== deleteId))
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleHelpful = async (id: number) => {
    try {
      const { data } = await reviewsApi.toggleHelpful(id)
      toast.success(data.message)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold font-display">
            {isSeeker ? 'My Reviews' : 'Reviews Received'}
          </h1>
          {isSeeker && (
            <Button onClick={() => setCreateOpen(true)} disabled={reviewableApplications.length === 0}>
              Write Review
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {isSeeker ? 'Reviews you\'ve written about employers' : 'What applicants say about your postings'}
        </p>
      </div>

      {loadError && !loading && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button size="sm" variant="outline" onClick={fetchReviews}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {!loading && reviews.length > 0 && avgRating && (
        <Card className="mb-6">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold font-display">{avgRating}</p>
              <StarRating value={Math.round(Number(avgRating))} readonly />
              <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            </div>
            <Separator orientation="vertical" className="h-16" />
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map(star => {
                const count = reviews.filter(r => r.rating === star).length
                const pct = reviews.length ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-right text-muted-foreground">{star}</span>
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-muted-foreground w-5">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title={isSeeker ? 'No reviews yet' : 'No reviews received'}
          description={isSeeker ? 'Write reviews for employers after your applications are processed.' : 'Reviews will appear here once applicants submit them.'}
          action={
            isSeeker
              ? (
                reviewableApplications.length > 0
                  ? <Button onClick={() => setCreateOpen(true)}>Write Review</Button>
                  : <Button asChild variant="outline"><Link to="/applications">View Applications</Link></Button>
              )
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <Link to={`/jobs/${review.job}`} className="font-semibold text-sm hover:text-primary transition-colors">{review.job_title}</Link>
                    <p className="text-xs text-muted-foreground">
                      {isSeeker ? `Recruiter: ${review.recruiter_name}` : `By: ${review.reviewer_name}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StarRating value={review.rating} readonly />
                    <span className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {!isSeeker && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2" onClick={() => handleHelpful(review.id)}>
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" />Helpful
                    </Button>
                  )}
                  {isSeeker && (
                    <>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(review.id)}>
                        <Edit className="h-3.5 w-3.5 mr-1" />Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setDeleteId(review.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Write a Review</DialogTitle></DialogHeader>
          {reviewableApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no reviewable applications right now.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Job</Label>
                <Select value={createJobId} onValueChange={setCreateJobId}>
                  <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                  <SelectContent>
                    {reviewableApplications.map((app) => (
                      <SelectItem key={app.id} value={String(app.job)}>
                        {app.job_title} - {app.job_company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <StarRating value={createRating} onChange={setCreateRating} />
              </div>
              <div className="space-y-1.5">
                <Label>Comment (optional)</Label>
                <Textarea
                  value={createComment}
                  onChange={(e) => setCreateComment(e.target.value)}
                  placeholder="Share your experience with this employer..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || reviewableApplications.length === 0}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <StarRating value={editRating} onChange={setEditRating} />
            </div>
            <div className="space-y-1.5">
              <Label>Comment (optional)</Label>
              <Textarea value={editComment} onChange={e => setEditComment(e.target.value)} placeholder="Share your experience..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete review?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove your review.</p>
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
