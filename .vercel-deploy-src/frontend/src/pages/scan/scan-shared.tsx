import type { ReactNode } from 'react'
import { WheatIcon } from 'lucide-react'
import milletsNowLogo from '@/assets/milletsnow-logo.jpeg'
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
    <header className="flex justify-center pb-4 sm:pb-5">
      <img
        src={milletsNowLogo}
        alt="MilletsNow"
        className="block h-auto w-full max-w-[240px] object-contain sm:max-w-[280px]"
      />
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
  const items: Array<{ label: string; href: string; icon: SocialIconComponent }> = []
  if (socialLinks.instagram) items.push({ label: 'Instagram', href: socialLinks.instagram, icon: InstagramMark })
  if (socialLinks.facebook) items.push({ label: 'Facebook', href: socialLinks.facebook, icon: FacebookMark })
  if (socialLinks.youtube) items.push({ label: 'YouTube', href: socialLinks.youtube, icon: YouTubeMark })

  if (!items.length) return null

  return (
    <section className={cn('rounded-[1.5rem] border border-border/70 bg-white/95 p-4 shadow-soft', className)}>
      <p className="text-sm font-semibold text-foreground">Follow MilletsNow</p>
      <div className="mt-3 grid grid-cols-3 justify-items-center gap-3">
        {items.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="flex h-16 w-full max-w-24 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50/55 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <Icon className="block h-6 w-6 shrink-0" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  )
}

type SocialIconProps = React.ComponentProps<'svg'>
type SocialIconComponent = (props: SocialIconProps) => ReactNode

function InstagramMark({ className, ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('block shrink-0', className)}
      {...props}
    >
      <defs>
        <linearGradient id="instagram-gradient" x1="4.2" y1="19.8" x2="19.8" y2="4.2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.32" stopColor="#fa7e1e" />
          <stop offset="0.62" stopColor="#d62976" />
          <stop offset="0.82" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5.25" fill="url(#instagram-gradient)" />
      <circle cx="12" cy="12" r="4.1" stroke="#fff" strokeWidth="1.9" />
      <circle cx="17.35" cy="6.7" r="1.2" fill="#fff" />
    </svg>
  )
}

function FacebookMark({ className, ...props }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('block shrink-0', className)} {...props}>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.021 10.125 11.927v-8.438H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.696 4.533-4.696 1.313 0 2.686.236 2.686.236v2.97H15.83c-1.49 0-1.955.931-1.955 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.099 24 12.073Z"
      />
      <path
        fill="#fff"
        d="M16.671 15.563l.532-3.49h-3.328V9.81c0-.956.466-1.887 1.955-1.887h1.514v-2.97s-1.373-.236-2.686-.236c-2.741 0-4.533 1.671-4.533 4.696v2.659H7.078v3.49h3.047V24a12.13 12.13 0 0 0 3.75 0v-8.438h2.796Z"
      />
    </svg>
  )
}

function YouTubeMark({ className, ...props }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('block shrink-0', className)} {...props}>
      <path
        fill="#FF0000"
        d="M23.5 6.2a3.04 3.04 0 0 0-2.14-2.15C19.47 3.5 12 3.5 12 3.5s-7.47 0-9.36.55A3.04 3.04 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3.04 3.04 0 0 0 2.14 2.15C4.53 20.5 12 20.5 12 20.5s7.47 0 9.36-.55a3.04 3.04 0 0 0 2.14-2.15C24 15.9 24 12 24 12s0-3.9-.5-5.8Z"
      />
      <path fill="#fff" d="M9.6 15.46V8.54L15.69 12 9.6 15.46Z" />
    </svg>
  )
}
