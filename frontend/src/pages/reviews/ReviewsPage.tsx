import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Edit, Trash2, Loader2, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/EmptyState'
import { reviewsApi } from '@/api/reviews'
import { useAuth } from '@/context/AuthContext'
import { extractErrorMessage, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import type { ReviewListItem } from '@/types'

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
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = isSeeker ? await reviewsApi.myReviews() : await reviewsApi.myReceivedReviews()
      setReviews(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [isSeeker])

  const openEdit = (review: ReviewListItem & { comment?: string }) => {
    setEditId(review.id)
    setEditRating(review.rating)
    setEditComment(review.comment || '')
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!editId) return
    setSaving(true)
    try {
      await reviewsApi.update(editId, { rating: editRating, comment: editComment })
      toast.success('Review updated')
      setEditOpen(false)
      fetchReviews()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
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
      await reviewsApi.toggleHelpful(id)
      toast.success('Marked as helpful')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display">
          {isSeeker ? 'My Reviews' : 'Reviews Received'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isSeeker ? 'Reviews you\'ve written about employers' : 'What applicants say about your postings'}
        </p>
      </div>

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
          action={isSeeker ? <Button asChild variant="outline"><Link to="/applications">View Applications</Link></Button> : undefined}
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
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(review as ReviewListItem & { comment?: string })}>
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
