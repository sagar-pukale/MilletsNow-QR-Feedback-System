type FeedbackTrackingInput = {
  type: 'feedback' | 'compliment' | 'complaint' | 'question'
  rating?: number | null
  category?: string | null
  source: 'product_qr' | 'common_qr'
  message?: string | null
}

type FeedbackTrackingStatus = 'new' | 'in_review' | 'resolved' | 'archived'
type FeedbackTrackingPriority = 'low' | 'medium' | 'high' | 'urgent'

export type FeedbackTrackingDecision = {
  status: FeedbackTrackingStatus
  trackingPriority: FeedbackTrackingPriority
  resolvedAt: Date | null
  statusChangedAt: Date
  lastActionAt: Date
}

export function decideFeedbackTracking(input: FeedbackTrackingInput, now = new Date()): FeedbackTrackingDecision {
  const normalizedCategory = (input.category ?? '').trim().toLowerCase()
  const normalizedMessage = (input.message ?? '').trim()
  const rating = input.rating ?? null

  if (input.type === 'compliment') {
    return {
      status: 'resolved',
      trackingPriority: 'low',
      resolvedAt: now,
      statusChangedAt: now,
      lastActionAt: now,
    }
  }

  if (input.type === 'question') {
    return {
      status: 'in_review',
      trackingPriority: normalizedMessage.length > 180 ? 'high' : 'medium',
      resolvedAt: null,
      statusChangedAt: now,
      lastActionAt: now,
    }
  }

  if (input.type === 'complaint') {
    const urgentCategory = ['product quality', 'packaging'].includes(normalizedCategory)
    return {
      status: 'in_review',
      trackingPriority: urgentCategory || rating != null && rating <= 2 ? 'urgent' : 'high',
      resolvedAt: null,
      statusChangedAt: now,
      lastActionAt: now,
    }
  }

  if (rating != null && rating <= 2) {
    return {
      status: 'in_review',
      trackingPriority: 'high',
      resolvedAt: null,
      statusChangedAt: now,
      lastActionAt: now,
    }
  }

  if (rating === 3 || normalizedMessage.length > 140) {
    return {
      status: 'new',
      trackingPriority: input.source === 'common_qr' ? 'medium' : 'high',
      resolvedAt: null,
      statusChangedAt: now,
      lastActionAt: now,
    }
  }

  return {
    status: 'resolved',
    trackingPriority: 'low',
    resolvedAt: now,
    statusChangedAt: now,
    lastActionAt: now,
  }
}

export function trackingDueAt(priority: FeedbackTrackingPriority, submittedAt: Date) {
  const hours =
    priority === 'urgent' ? 4 :
    priority === 'high' ? 12 :
    priority === 'medium' ? 24 :
    72

  return new Date(submittedAt.getTime() + hours * 60 * 60 * 1000)
}

export function isTrackingOverdue(status: FeedbackTrackingStatus, dueAt: Date, now = new Date()) {
  return status !== 'resolved' && status !== 'archived' && dueAt.getTime() < now.getTime()
}
