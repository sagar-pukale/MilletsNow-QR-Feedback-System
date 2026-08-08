import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRightIcon, Globe2Icon, HeartIcon, MapPinIcon, MessageCircleIcon, MessageSquareHeartIcon, MessageSquareWarningIcon, PhoneCallIcon, HelpCircleIcon, WheatIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { API_URL } from '@/context/auth-context'

const actions = [
  { label: 'Feedback', description: 'Give Feedback', icon: MessageSquareHeartIcon, tone: 'bg-brand-50 text-brand-700', feedback: true },
  { label: 'Compliment', description: 'Appreciate Product', icon: HeartIcon, tone: 'bg-rose-50 text-rose-600' },
  { label: 'Complaint', description: 'Report Issue', icon: MessageSquareWarningIcon, tone: 'bg-amber-50 text-amber-700' },
  { label: 'Question', description: 'Ask a Question', icon: HelpCircleIcon, tone: 'bg-blue-50 text-blue-700' },
  { label: 'WhatsApp', description: 'Open WhatsApp', icon: MessageCircleIcon, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Website', description: 'Open Website', icon: Globe2Icon, tone: 'bg-slate-100 text-slate-700' },
  { label: 'Instagram', description: 'Open Instagram', icon: Globe2Icon, tone: 'bg-pink-50 text-pink-700' },
  { label: 'Facebook', description: 'Open Facebook', icon: Globe2Icon, tone: 'bg-indigo-50 text-indigo-700' },
  { label: 'Call Us', description: 'Call Company', icon: PhoneCallIcon, tone: 'bg-cyan-50 text-cyan-700' },
  { label: 'Location', description: 'Open Google Maps', icon: MapPinIcon, tone: 'bg-orange-50 text-orange-700' },
]

type ScanProduct = { name: string; brand?: string | null; category?: string | null; batchNumber?: string | null; manufacturingDate?: string | null; expiryDate?: string | null; mrp?: string | number | null; weight?: string | number | null; unit?: string | null; description?: string | null; image?: string | null }

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '--' }

function ScanPage() {
  const { qrToken = '' } = useParams()
  const [product, setProduct] = useState<ScanProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch(`${API_URL}/scan/${encodeURIComponent(qrToken)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? 'This QR code is invalid or no longer active.' : 'Unable to load this product right now.')
        return response.json() as Promise<{ product: ScanProduct }>
      })
      .then((payload) => { if (active) setProduct(payload.product) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load this product right now.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [qrToken])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-white px-5 text-center"><p className="text-sm text-muted-foreground">Loading product details...</p></main>
  if (error || !product) return <main className="flex min-h-screen items-center justify-center bg-white px-5 text-center"><div><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-primary"><WheatIcon className="size-7" /></div><h1 className="mt-5 font-heading text-2xl font-bold">Product unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error || 'This QR code is invalid or no longer active.'}</p><Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white">Back to MilletsNow</Link></div></main>

  const imageUrl = product.image ? (product.image.startsWith('http') ? product.image : `${API_URL}/${product.image.replace(/^\/+/, '')}`) : null
  return <main className="min-h-screen bg-white text-foreground"><div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
    <header className="flex items-center justify-center gap-2 text-primary"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-soft"><WheatIcon className="size-5" /></span><div><p className="font-heading text-lg font-bold tracking-tight">MilletsNow</p><p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">QR Feedback Platform</p></div></header>
    <section className="mt-7 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card"><div className="flex min-h-48 items-center justify-center bg-gradient-to-br from-brand-50 via-white to-secondary p-6">{imageUrl ? <img src={imageUrl} alt={product.name} className="max-h-48 max-w-full object-contain" /> : <span className="text-8xl drop-shadow-sm" role="img" aria-label="Product image">🌾</span>}</div><div className="space-y-5 p-5 sm:p-7"><div><p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{product.brand ?? 'MilletsNow'} product</p><h1 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1><p className="mt-1 text-sm text-muted-foreground">{product.category ?? 'Millet product'}{product.batchNumber ? ` · Batch ${product.batchNumber}` : ''}</p></div><p className="text-sm leading-6 text-muted-foreground">{product.description ?? 'Discover the goodness of MilletsNow.'}</p><div className="grid grid-cols-2 gap-3 rounded-2xl bg-secondary/70 p-4 sm:grid-cols-4"><Info label="Manufactured" value={formatDate(product.manufacturingDate)} /><Info label="Best before" value={formatDate(product.expiryDate)} /><Info label="MRP" value={product.mrp ? `₹${product.mrp}` : '--'} /><Info label="Weight" value={product.weight && product.unit ? `${product.weight} ${product.unit}` : '--'} /></div></div></section>
    <section className="mt-8"><h2 className="text-center font-heading text-xl font-bold tracking-tight sm:text-2xl">What would you like to do?</h2><p className="mt-2 text-center text-sm text-muted-foreground">We&apos;d love to hear from you.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{actions.map(({ label, description, icon: Icon, tone, feedback }) => { const content = <><span className={cn('flex size-10 items-center justify-center rounded-xl', tone)}><Icon className="size-5" /></span><span><span className="block text-sm font-bold">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{description}</span></span><ArrowUpRightIcon className="absolute top-3 right-3 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></>; return feedback ? <Link key={label} to={`/scan/${qrToken}/feedback`} className="group relative flex min-h-32 flex-col items-start justify-between rounded-2xl border border-border/70 bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{content}</Link> : <button key={label} type="button" className="group relative flex min-h-32 flex-col items-start justify-between rounded-2xl border border-border/70 bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{content}</button> })}</div></section>
    <footer className="mt-10 border-t border-border/70 pt-6 text-center"><p className="text-sm font-semibold text-foreground">About MilletsNow</p><div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><button type="button" className="hover:text-primary">Privacy Policy</button><button type="button" className="hover:text-primary">Terms</button><button type="button" className="hover:text-primary">Customer Care</button></div><p className="mt-4 text-[11px] text-muted-foreground">© 2026 MilletsNow · Made with care for better food choices.</p></footer>
  </div></main>
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p><p className="mt-1 text-xs font-bold text-foreground">{value}</p></div> }

export default ScanPage
