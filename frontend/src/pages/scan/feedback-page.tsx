import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeftIcon, ImagePlusIcon, LoaderCircleIcon, StarIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { collectFeedbackLocation } from '@/lib/feedback-submission-metadata'
import { BrandHeader, CustomerPageShell, FollowUs, ProductHero, resolveAssetUrl, type ScanPayload } from './scan-shared'

type FlowType = 'feedback' | 'complaint' | 'compliment'
type Errors = Partial<Record<'rating' | 'quality' | 'message' | 'category' | 'form', string>>

const qualityOptions = ['Excellent', 'Good', 'Average', 'Poor'] as const
const complaintCategories = ['Product Quality', 'Packaging', 'Delivery', 'Other'] as const

function FeedbackPage() {
  const { qrToken = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const submissionType = useMemo<FlowType>(() => {
    const raw = searchParams.get('type')
    return raw === 'complaint' || raw === 'compliment' ? raw : 'feedback'
  }, [searchParams])

  const [payload, setPayload] = useState<ScanPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [rating, setRating] = useState(0)
  const [quality, setQuality] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [locationNotice, setLocationNotice] = useState('We request your location once during submission for feedback and admin analytics. You can deny it and your feedback will still be submitted.')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let active = true

    fetch(`/api/scan/${encodeURIComponent(qrToken)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'This product QR is invalid or no longer active.'
              : 'We could not load this product right now.',
          )
        }

        return response.json() as Promise<ScanPayload>
      })
      .then((body) => {
        if (active) setPayload(body)
      })
      .catch((reason: unknown) => {
        if (active) setLoadingError(reason instanceof Error ? reason.message : 'We could not load this product right now.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [qrToken])

  const copy = getCopy(submissionType)
  const imagePreview = image ? URL.createObjectURL(image) : null

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    },
    [imagePreview],
  )

  const validate = () => {
    const nextErrors: Errors = {}

    if ((submissionType === 'feedback' || submissionType === 'compliment') && !rating) {
      nextErrors.rating = 'Please select a rating.'
    }

    if (submissionType === 'feedback' && !quality) {
      nextErrors.quality = 'Please select taste / quality.'
    }

    if (submissionType === 'complaint') {
      if (!category) nextErrors.category = 'Please select a complaint category.'
      if (!message.trim()) nextErrors.message = 'Please describe the complaint.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return

    setSubmitting(true)
    setErrors({})

    const body = new FormData()
    body.append('type', submissionType)
    body.append('qrToken', qrToken)
    if (rating) body.append('rating', String(rating))
    if (quality) body.append('quality', quality)
    if (category) body.append('category', category)
    if (message.trim()) body.append('message', message.trim())
    if (image) body.append('image', image)

    try {
      const location = await collectFeedbackLocation()
      if (location.status === 'granted') {
        if (location.payload.latitude != null) body.append('latitude', String(location.payload.latitude))
        if (location.payload.longitude != null) body.append('longitude', String(location.payload.longitude))
        if (location.payload.locationAccuracy != null) body.append('locationAccuracy', String(location.payload.locationAccuracy))
        setLocationNotice('Location captured for this feedback submission.')
      } else if (location.status === 'denied') {
        setLocationNotice('Location permission was denied. Feedback will be submitted without location.')
      } else {
        setLocationNotice('Location was unavailable on this device. Feedback will be submitted without location.')
      }

      const response = await fetch('/api/feedback', { method: 'POST', body })
      const payloadBody = (await response.json().catch(() => null)) as { error?: string; details?: Record<string, string[]> } | null

      if (!response.ok) {
        if (payloadBody?.details) {
          const nextErrors: Errors = {}
          for (const [key, value] of Object.entries(payloadBody.details)) {
            if (Array.isArray(value) && value[0]) {
              nextErrors[key as keyof Errors] = value[0]
            }
          }
          setErrors(nextErrors)
        }
        throw new Error(payloadBody?.error ?? 'Unable to submit your response right now.')
      }

      navigate(`/scan/${qrToken}/thank-you?type=${submissionType}`, {
        replace: true,
        state: { productName: payload?.product.name ?? 'MilletsNow product' },
      })
    } catch (reason: unknown) {
      setErrors((current) => ({
        ...current,
        form: reason instanceof Error ? reason.message : 'Unable to submit your response right now.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <CustomerPageShell>
        <BrandHeader />
        <div className="rounded-[2rem] border border-border/70 bg-white px-6 py-14 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Loading form...</p>
        </div>
      </CustomerPageShell>
    )
  }

  if (!payload || loadingError) {
    return (
      <CustomerPageShell>
        <BrandHeader />
        <div className="rounded-[2rem] border border-border/70 bg-white px-6 py-12 text-center shadow-card">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <TriangleAlertIcon className="size-7" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-bold">Form unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadingError}</p>
        </div>
      </CustomerPageShell>
    )
  }

  return (
    <CustomerPageShell>
      <BrandHeader />
      <div className="mb-4">
        <Link to={`/scan/${qrToken}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeftIcon className="size-4" />
          Back
        </Link>
      </div>
      <ProductHero product={payload.product} subtitle={copy.subtitle} />
      <section className="mt-6 rounded-[2rem] border border-border/70 bg-white p-5 shadow-card">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-50">
            {resolveAssetUrl(payload.product.image) ? (
              <img src={resolveAssetUrl(payload.product.image) ?? ''} alt="" className="size-full object-cover" />
            ) : (
              <StarIcon className="size-6 text-brand-700" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{copy.eyebrow}</p>
            <h1 className="font-heading text-2xl font-bold">{copy.title}</h1>
          </div>
        </div>

        {(submissionType === 'feedback' || submissionType === 'compliment') ? (
          <Field label="Overall experience">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                  onClick={() => setRating(value)}
                  className="rounded-2xl p-1.5 text-amber-400 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <StarIcon className={`size-8 ${value <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            {errors.rating ? <FieldError message={errors.rating} /> : null}
          </Field>
        ) : null}

        {submissionType === 'feedback' ? (
          <Field label="Taste / Quality">
            <div className="grid grid-cols-2 gap-3">
              {qualityOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setQuality(option)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    quality === option ? 'border-primary bg-brand-50 text-primary' : 'border-border bg-secondary/40 text-foreground'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {errors.quality ? <FieldError message={errors.quality} /> : null}
          </Field>
        ) : null}

        {submissionType === 'complaint' ? (
          <Field label="Complaint category">
            <div className="grid grid-cols-2 gap-3">
              {complaintCategories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    category === option ? 'border-primary bg-brand-50 text-primary' : 'border-border bg-secondary/40 text-foreground'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {errors.category ? <FieldError message={errors.category} /> : null}
          </Field>
        ) : null}

        <Field label={copy.messageLabel}>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-32 resize-none"
            placeholder={copy.messagePlaceholder}
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message ? <FieldError message={errors.message} /> : null}
        </Field>

        {(submissionType === 'feedback' || submissionType === 'complaint') ? (
          <Field label="Optional image upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-dashed border-border bg-secondary/40 px-4 text-left text-sm"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-primary">
                  <ImagePlusIcon className="size-5" />
                </span>
                <span>{image ? image.name : 'Choose an image'}</span>
              </span>
              <span className="text-muted-foreground">Upload</span>
            </button>
            {imagePreview ? (
              <img src={imagePreview} alt="Selected upload preview" className="mt-3 h-28 w-28 rounded-2xl object-cover" />
            ) : null}
          </Field>
        ) : null}

        {errors.form ? <FieldError message={errors.form} className="mt-2" /> : null}
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{locationNotice}</p>

        <Button type="button" size="lg" className="mt-6 h-12 w-full rounded-2xl" disabled={submitting} onClick={() => void submit()}>
          {submitting ? (
            <>
              <LoaderCircleIcon className="size-5 animate-spin" />
              Submitting...
            </>
          ) : (
            copy.submitLabel
          )}
        </Button>
      </section>
      <FollowUs className="mt-6" />
    </CustomerPageShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-5 block">
      <span className="mb-3 block text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  )
}

function FieldError({ message, className = '' }: { message: string; className?: string }) {
  return <p className={`mt-2 text-sm text-destructive ${className}`}>{message}</p>
}

function getCopy(type: FlowType) {
  if (type === 'complaint') {
    return {
      eyebrow: 'Complaint',
      title: 'Report an issue',
      subtitle: 'Tell us what went wrong so we can resolve it quickly.',
      messageLabel: 'Complaint description',
      messagePlaceholder: 'Describe the issue you faced with this product.',
      submitLabel: 'Submit Complaint',
    }
  }

  if (type === 'compliment') {
    return {
      eyebrow: 'Rate & Compliment',
      title: 'Rate and share what you liked',
      subtitle: 'Rate the product and tell us what stood out for you.',
      messageLabel: 'Tell us what you liked about the product',
      messagePlaceholder: 'Share your compliment or appreciation.',
      submitLabel: 'Submit Rating',
    }
  }

  return {
    eyebrow: 'Feedback',
    title: 'Share your experience',
    subtitle: 'Help us improve with your honest feedback.',
    messageLabel: 'Customer feedback / message',
    messagePlaceholder: 'Tell us more about your experience.',
    submitLabel: 'Submit Feedback',
  }
}

export default FeedbackPage
