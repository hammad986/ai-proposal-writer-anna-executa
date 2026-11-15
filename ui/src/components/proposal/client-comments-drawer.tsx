import { useState } from 'react'
import {
  MessageSquare,
  CheckCircle2,
  X,
  Send,
  CornerDownRight,
  User,
  Shield,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GeneratedProposal, ProposalComment } from '@/types'

interface ClientCommentsDrawerProps {
  proposal: GeneratedProposal
  onUpdateProposal: (updated: GeneratedProposal) => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export function ClientCommentsDrawer({
  proposal,
  onUpdateProposal,
  onClose,
  toast,
}: ClientCommentsDrawerProps) {
  const [newCommentText, setNewCommentText] = useState('')
  const [authorName, setAuthorName] = useState(
    proposal.formData.step1.clientName || 'Client Reviewer'
  )
  const [selectedSectionId, setSelectedSectionId] = useState<string>('general')
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})

  const comments = proposal.comments || []

  const handleAddComment = () => {
    if (!newCommentText.trim()) {
      toast.error('Please enter a comment.')
      return
    }

    const sectionTitle =
      selectedSectionId === 'general'
        ? 'General Scope & Commercials'
        : proposal.sections.find((s) => s.id === selectedSectionId)?.title || 'General'

    const newComment: ProposalComment = {
      id: `comment_${Date.now()}`,
      sectionId: selectedSectionId,
      sectionTitle,
      authorName: authorName.trim() || 'Client Reviewer',
      authorRole: 'client',
      message: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
    }

    const updatedComments = [newComment, ...comments]
    onUpdateProposal({
      ...proposal,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    })

    setNewCommentText('')
    toast.success('Question / feedback submitted!')
  }

  const handleAddReply = (commentId: string) => {
    const replyText = replyTextMap[commentId]
    if (!replyText?.trim()) return

    const updatedComments = comments.map((c) =>
      c.id === commentId
        ? {
            ...c,
            reply: replyText.trim(),
            repliedAt: new Date().toISOString(),
            resolved: true,
          }
        : c
    )

    onUpdateProposal({
      ...proposal,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    })

    setReplyTextMap({ ...replyTextMap, [commentId]: '' })
    toast.success('Response logged and marked resolved!')
  }

  const handleToggleResolved = (commentId: string) => {
    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    )
    onUpdateProposal({
      ...proposal,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-card border-l shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Client Feedback &amp; Q&amp;A Hub</h2>
              <p className="text-[11px] text-muted-foreground">
                Collaborative inline section discussion and clarifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
          {comments.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <h4 className="text-xs font-semibold text-foreground">No Questions or Comments Yet</h4>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Clients can leave questions about deliverables, milestones, or terms right here during review.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl border p-3.5 space-y-2.5 text-xs transition-colors ${
                  comment.resolved ? 'bg-muted/20 border-border' : 'bg-card border-primary/20 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{comment.authorName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                      {comment.authorRole === 'client' ? 'Client' : 'Agency'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {comment.createdAt.slice(0, 10)}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-primary">
                  Re: {comment.sectionTitle}
                </div>

                <p className="text-foreground/90 text-xs leading-relaxed">{comment.message}</p>

                {/* Agency Reply if present */}
                {comment.reply && (
                  <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 text-xs border border-indigo-500/10 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-primary font-semibold">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Agency Response
                      </span>
                      {comment.repliedAt && <span>{comment.repliedAt.slice(0, 10)}</span>}
                    </div>
                    <p className="text-foreground/80 text-[11px] leading-relaxed">{comment.reply}</p>
                  </div>
                )}

                {/* Reply Form & Resolved Toggle */}
                <div className="pt-1 flex items-center justify-between border-t border-border/50 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleToggleResolved(comment.id)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${comment.resolved ? 'text-emerald-500' : ''}`}
                    />
                    {comment.resolved ? 'Resolved' : 'Mark as Resolved'}
                  </button>

                  {!comment.reply && (
                    <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                      <input
                        type="text"
                        value={replyTextMap[comment.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap({ ...replyTextMap, [comment.id]: e.target.value })
                        }
                        placeholder="Type reply..."
                        className="w-full text-[11px] px-2 py-1 rounded border bg-background"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-xs"
                        onClick={() => handleAddReply(comment.id)}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Box to Post New Comment */}
        <div className="p-4 border-t bg-muted/20 space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your Name"
              className="w-1/2 text-xs px-2.5 py-1.5 rounded-lg border bg-background"
            />
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-1/2 text-xs px-2 py-1.5 rounded-lg border bg-background text-foreground"
            >
              <option value="general">General Commercials</option>
              {proposal.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <textarea
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Leave a comment or question about this proposal..."
              className="w-full text-xs p-2 rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button onClick={handleAddComment} className="h-auto px-3 self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
