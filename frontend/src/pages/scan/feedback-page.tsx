import { useEffect, useState } from 'react'
import { ArrowLeftIcon, StarIcon, WheatIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { API_URL } from '@/context/auth-context'

const categories = ['Product Quality', 'Taste', 'Packaging', 'Value for Money', 'Overall Experience']

function FeedbackPage() {
  const { qrToken = '' } = useParams()
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [productName, setProductName] = useState('MilletsNow product')

  useEffect(() => {
    fetch(`${API_URL}/scan/${encodeURIComponent(qrToken)}`)
      .then((response) => response.ok ? response.json() as Promise<{ product?: { name?: string } }> : null)
      .then((payload) => { if (payload?.product?.name) setProductName(payload.product.name) })
      .catch(() => undefined)
  }, [qrToken])

  const submitFeedback = async () => {
    setSubmitting(true); setError('')
    try {
      const response = await fetch(`${API_URL}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'feedback', qrToken, rating, message: message.trim() || 'Customer feedback submitted' }) })
      if (!response.ok) throw new Error('Unable to submit feedback')
      setSubmitted(true)
    } catch { setError('Unable to submit feedback right now. Please try again.') } finally { setSubmitting(false) }
  }

  if (submitted) return <main className="flex min-h-screen items-center justify-center bg-white px-5 text-center"><div><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><StarIcon className="size-7 fill-current" /></div><h1 className="mt-5 font-heading text-2xl font-bold">Thank you for your feedback!</h1><p className="mt-2 text-sm text-muted-foreground">Your experience helps us make MilletsNow better.</p><Link to={`/scan/${qrToken}`} className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">Back to product</Link></div></main>

  return <main className="min-h-screen bg-[#fafafa] text-foreground"><div className="mx-auto w-full max-w-lg px-5 py-6 sm:py-10"><header className="flex items-center justify-between"><Link to={`/scan/${qrToken}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeftIcon className="size-4" /> Back</Link><div className="flex items-center gap-2 text-primary"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white"><WheatIcon className="size-4" /></span><span className="font-heading font-bold">MilletsNow</span></div></header><section className="mt-8 rounded-3xl border border-border/70 bg-white p-5 shadow-card sm:p-7"><p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{productName}</p><h1 className="mt-2 font-heading text-2xl font-bold">How was your experience?</h1><div className="mt-5 flex justify-center gap-2" aria-label="Rating"><span className="sr-only">Rating: {rating} out of 5</span>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} stars`} onClick={() => setRating(value)} className="rounded-lg p-1 text-amber-400 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary"><StarIcon className={`size-8 ${value <= rating ? 'fill-current' : ''}`} /></button>)}</div><div className="mt-7 space-y-4">{categories.map((category) => <label key={category} className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm font-medium"><span>{category}</span><input type="checkbox" className="size-4 accent-primary" /></label>)}</div><label className="mt-6 block text-sm font-semibold">Tell us more...<Textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-28 resize-none" placeholder="Share your thoughts with us" /></label><div className="mt-6 space-y-3"><Input placeholder="Name" aria-label="Name" /><Input placeholder="Mobile" type="tel" aria-label="Mobile" /><Input placeholder="Email" type="email" aria-label="Email" /></div>{error ? <p role="alert" className="mt-4 text-sm text-destructive">{error}</p> : null}<Button type="button" className="mt-6 h-12 w-full rounded-xl text-base" disabled={!rating || submitting} onClick={() => void submitFeedback()}>{submitting ? 'Submitting…' : 'Submit Feedback'}</Button></section></div></main>
}

export default FeedbackPage
