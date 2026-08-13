import type { ReactNode } from 'react'
import type { SVGProps } from 'react'
import { MessageCircleIcon, WheatIcon } from 'lucide-react'
import { socialLinks } from '@/constants/social-links'
import { assetUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

export type ScanProduct = {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  batchNumber?: string | null
  manufacturingDate?: string | null
  expiryDate?: string | null
  mrp?: string | number | null
  weight?: string | number | null
  unit?: string | null
  description?: string | null
  image?: string | null
}

export type ScanPayload = {
  token: string
  destinationUrl?: string
  product: ScanProduct
}

export function resolveAssetUrl(value?: string | null) {
  return assetUrl(value) || null
}

export function CustomerPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fcf7f8_50%,#fff_100%)] text-foreground">
      <div className="mx-auto w-full max-w-xl px-4 py-5 sm:px-6 sm:py-8">{children}</div>
    </main>
  )
}

export function BrandHeader() {
  return (
    <header className="flex items-center justify-center gap-3 pb-4">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
        <WheatIcon className="size-5" />
      </span>
      <div>
        <p className="font-heading text-lg font-bold tracking-tight text-primary">MilletsNow</p>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">Launchpad</p>
      </div>
    </header>
  )
}

export function ProductHero({ product, subtitle }: { product: ScanProduct; subtitle: string }) {
  const imageUrl = resolveAssetUrl(product.image)

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-card">
      <div className="flex min-h-64 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(123,30,58,0.10),_transparent_55%),linear-gradient(180deg,#fff_0%,#fbf3f5_100%)] p-6">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="max-h-56 max-w-full object-contain" />
        ) : (
          <div className="flex size-36 items-center justify-center rounded-[2rem] border border-dashed border-brand-200 bg-brand-50 text-brand-700">
            <WheatIcon className="size-14" />
          </div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">{product.brand ?? 'MilletsNow'}</p>
        <div>
          <h1 className="font-heading text-[1.75rem] font-bold leading-tight">{product.name}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>
        {product.description ? <p className="text-sm leading-6 text-muted-foreground">{product.description}</p> : null}
      </div>
    </section>
  )
}

export function FollowUs({ className }: { className?: string }) {
  const items = [
    { label: 'Instagram', href: socialLinks.instagram, icon: InstagramMark },
    { label: 'Facebook', href: socialLinks.facebook, icon: FacebookMark },
    { label: 'YouTube', href: socialLinks.youtube, icon: YouTubeMark },
    { label: 'WhatsApp', href: socialLinks.whatsapp, icon: MessageCircleIcon },
  ]

  return (
    <section className={cn('rounded-[1.5rem] border border-border/70 bg-white/95 p-4 shadow-soft', className)}>
      <p className="text-sm font-semibold text-foreground">Follow MilletsNow</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        {items.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-border/70 bg-secondary/60 text-muted-foreground transition-colors hover:border-primary/20 hover:text-primary"
          >
            <Icon className="size-5" />
          </a>
        ))}
      </div>
    </section>
  )
}

function InstagramMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7h2.3l.4-3h-2.7V9.2c0-.9.3-1.6 1.6-1.6H16V5.1c-.2 0-.9-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.3V11H9v3h2.3v7h2.2Z" />
    </svg>
  )
}

function YouTubeMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.2 8.4a2.9 2.9 0 0 0-2-2C17.4 6 12 6 12 6s-5.4 0-7.2.4a2.9 2.9 0 0 0-2 2C2.4 10.2 2.4 12 2.4 12s0 1.8.4 3.6a2.9 2.9 0 0 0 2 2C6.6 18 12 18 12 18s5.4 0 7.2-.4a2.9 2.9 0 0 0 2-2c.4-1.8.4-3.6.4-3.6s0-1.8-.4-3.6ZM10.3 15.1V8.9l5.2 3.1-5.2 3.1Z" />
    </svg>
  )
}
