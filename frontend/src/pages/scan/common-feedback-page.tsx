import { ArrowRightIcon, LoaderCircleIcon, StarIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import milletsNowLogo from '@/assets/Milletslogo.jpeg'
import milletsProductsImage from '@/assets/products/millets-products.png'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { socialLinks } from '@/constants/social-links'
import { collectFeedbackLocation } from '@/lib/feedback-submission-metadata'
import { cn } from '@/lib/utils'
import { CustomerPageShell } from './scan-shared'

type Errors = Partial<Record<'rating' | 'message' | 'form', string>>

const milletsNowCollectionUrl = 'https://milletsnow.com/collections/all'
const accentCyan = '#2E9BB8'
const accentCyanSoft = '#E8F7FB'

function CommonFeedbackPage() {
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [locationNotice, setLocationNotice] = useState('We request your location once during submission for feedback and admin analytics. You can deny it and your feedback will still be submitted.')

  const submit = async () => {
    const nextErrors: Errors = {}
    if (!rating) nextErrors.rating = 'Please select a rating.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const location = await collectFeedbackLocation()
      if (location.status === 'granted') {
        setLocationNotice('Location captured for this feedback submission.')
      } else if (location.status === 'denied') {
        setLocationNotice('Location permission was denied. Feedback will be submitted without location.')
      } else {
        setLocationNotice('Location was unavailable on this device. Feedback will be submitted without location.')
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feedback',
          source: 'common_qr',
          rating,
          message: message.trim() || undefined,
          ...location.payload,
        }),
      })
      const body = (await response.json().catch(() => null)) as { error?: string; details?: Record<string, string[]> } | null
      if (!response.ok) {
        if (body?.details?.rating?.[0]) {
          setErrors({ rating: body.details.rating[0] })
        }
        throw new Error(body?.error ?? 'Unable to submit your feedback right now.')
      }

      navigate('/scan/thank-you', {
        replace: true,
        state: { productName: 'Common QR' },
      })
    } catch (reason: unknown) {
      setErrors((current) => ({
        ...current,
        form: reason instanceof Error ? reason.message : 'Unable to submit your feedback right now.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CustomerPageShell>
      <section className="relative overflow-hidden rounded-[2rem] border border-[#cfe8ef] bg-white shadow-[0_26px_60px_rgba(20,72,86,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,155,184,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(227,246,250,0.96),_transparent_30%),linear-gradient(180deg,#fbfeff_0%,#f4fafc_46%,#ffffff_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(46,155,184,0.42),transparent)]" />

        <div className="relative px-4 pb-4 pt-4 sm:p-7">
          <header className="flex justify-center">
            <div className="rounded-[1.6rem] border border-[#d7edf3] bg-white/92 px-3 py-3 shadow-[0_16px_34px_rgba(46,155,184,0.12)]">
              <div
                role="img"
                aria-label="MilletsNow"
                className="h-[108px] w-[176px] bg-contain bg-center bg-no-repeat sm:h-[112px] sm:w-[184px]"
                style={{ backgroundImage: `url(${milletsNowLogo})` }}
              />
            </div>
          </header>

          <div className="mt-3 text-center">
            <h1 className="font-heading text-[1.76rem] font-bold tracking-tight text-[#223038] sm:text-[1.95rem]">Share your feedback</h1>
          </div>

          <div className="mt-4 rounded-[1.6rem] border border-[#d4edf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,251,253,0.96))] p-4 shadow-[0_18px_44px_rgba(46,155,184,0.10)] sm:mt-7 sm:rounded-[1.85rem] sm:p-5">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-[#223038]">Your rating</p>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1 sm:gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                  onClick={() => setRating(value)}
                  className="rounded-2xl border border-transparent bg-white/80 p-1 text-[#f3b219] shadow-[0_8px_18px_rgba(46,155,184,0.08)] transition-transform hover:scale-105 focus-visible:outline-2 sm:p-1.5"
                  style={{ outlineColor: accentCyan }}
                >
                  <StarIcon className={`size-8 sm:size-9 ${value <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
            {errors.rating ? <p className="mt-3 text-center text-sm text-destructive">{errors.rating}</p> : null}

            <div className="mt-4 sm:mt-6">
              <label className="block text-sm font-semibold text-[#223038]">
                Feedback
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="mt-2 min-h-24 resize-none rounded-[1rem] border-[#d8ecf2] bg-white px-3 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:mt-3 sm:min-h-32 sm:rounded-[1.25rem] sm:px-3.5 sm:py-3"
                  placeholder="Tell us about your experience with MilletsNow."
                />
              </label>
            </div>

            {errors.form ? <p className="mt-3 text-sm text-destructive">{errors.form}</p> : null}
            <p className="mt-3 text-xs leading-5 text-[#61757d]">{locationNotice}</p>

            <Button
              type="button"
              size="lg"
              className="mt-4 h-11 w-full rounded-2xl border-0 text-[0.98rem] font-semibold text-white shadow-[0_16px_32px_rgba(46,155,184,0.28)] transition-all hover:-translate-y-0.5 hover:brightness-95 sm:mt-6 sm:h-12"
              disabled={submitting}
              onClick={() => void submit()}
              style={{ backgroundColor: accentCyan }}
            >
              {submitting ? (
                <>
                  <LoaderCircleIcon className="size-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>

          <section className="mt-4 sm:mt-5">
            <div className="relative overflow-hidden rounded-[1.7rem] border border-[#cae6ee] bg-[linear-gradient(180deg,rgba(251,254,255,0.98),rgba(239,249,252,0.96)_52%,rgba(247,252,253,0.98)_100%)] p-3.5 shadow-[0_22px_46px_rgba(46,155,184,0.10)] sm:p-4">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(46,155,184,0.46),transparent)]" />
              <div className="pointer-events-none absolute -right-12 top-5 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: accentCyanSoft }} />
              <div className="pointer-events-none absolute -left-8 bottom-1 h-24 w-24 rounded-full bg-[rgba(141,212,228,0.12)] blur-2xl" />

              <a
                href={milletsNowCollectionUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-[1.5rem] border border-[#cfe6ee] bg-[linear-gradient(160deg,#fbfffe_0%,#f2fbf6_34%,#ebfbff_74%,#f9feff_100%)] px-4 py-4 shadow-[0_16px_34px_rgba(46,155,184,0.10)] backdrop-blur-[2px] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-[#84c6d8] hover:shadow-[0_20px_40px_rgba(46,155,184,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7bc6d9]/35 sm:px-5 sm:py-5"
              >
                <div className="pointer-events-none absolute left-[-1.75rem] top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(162,223,200,0.28)_0%,rgba(162,223,200,0.05)_68%,transparent_72%)] blur-2xl" />
                <div className="pointer-events-none absolute right-0 top-3 h-[10rem] w-[10rem] rounded-full bg-[radial-gradient(circle,rgba(123,198,217,0.22)_0%,rgba(123,198,217,0.06)_58%,transparent_74%)] sm:right-2 sm:top-4 sm:h-[12.75rem] sm:w-[12.75rem]" />
                <div className="pointer-events-none absolute bottom-3 right-[5.5rem] h-6 w-10 rounded-full bg-[rgba(46,155,184,0.10)] blur-xl sm:right-[8.25rem] sm:h-7 sm:w-14" />

                <div className="relative grid min-h-[12rem] grid-cols-[minmax(0,1.08fr)_minmax(7.2rem,0.92fr)] items-center gap-2.5 sm:min-h-[13.75rem] sm:grid-cols-[minmax(0,0.96fr)_minmax(10.8rem,1.06fr)] sm:gap-5">
                  <div className="relative z-10 flex min-w-0 flex-col justify-center self-stretch pt-1 sm:pr-1">
                    <div className="pointer-events-none absolute left-0 top-0 text-[#8ac9a4]">
                      <svg viewBox="0 0 56 56" className="h-8 w-8 sm:h-9 sm:w-9" fill="none" aria-hidden="true">
                        <path d="M28 10c2 7 6 11 13 13-7 2-11 6-13 13-2-7-6-11-13-13 7-2 11-6 13-13Z" fill="currentColor" />
                        <path d="M42 29c1.3 4 3.8 6.4 7.8 7.7-4 .9-6.4 3.3-7.8 7.4-1.1-4-3.5-6.4-7.5-7.4 4-.9 6.4-3.4 7.5-7.7Z" fill="#b0e0a4" />
                      </svg>
                    </div>
                    <div className="pointer-events-none absolute left-3 top-8 text-[#9ad890]">
                      <svg viewBox="0 0 40 24" className="h-4 w-7 sm:h-[1.1rem] sm:w-8" fill="none" aria-hidden="true">
                        <path d="M3 20c7-1 11-5 15-14 1 8-1 14-7 17-3 1-5 0-8-3Z" fill="currentColor" />
                        <path d="M17 20c6-2 10-6 13-13 2 7 0 13-5 16-3 1-6 0-8-3Z" fill="#78c87f" />
                      </svg>
                    </div>

                    <div className="relative z-10 mt-2">
                      <p className="font-heading text-[1.42rem] font-black leading-[0.93] tracking-[-0.07em] text-[#245a39] sm:text-[2.18rem] sm:leading-[0.9]">
                        <span className="block whitespace-nowrap">Millets Hai</span>
                        <span className="mt-0.5 block whitespace-nowrap bg-[linear-gradient(90deg,#0e8579_0%,#0ca297_44%,#28bcb0_100%)] bg-clip-text text-transparent">
                          Smart Choice!
                        </span>
                      </p>
                      <svg viewBox="0 0 240 56" className="mt-1.5 h-7 w-[8.5rem] sm:mt-2.5 sm:h-8 sm:w-[11.25rem]" fill="none" aria-hidden="true">
                        <path
                          d="M12 28c23 12 67 13 111 4 24-5 46-13 73-24"
                          stroke="#29a8b3"
                          strokeWidth="9"
                          strokeLinecap="round"
                        />
                        <path
                          d="M168 14c9 2 16 8 20 16"
                          stroke="#7db768"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M188 21c6 0 11 3 14 8"
                          stroke="#7db768"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <span
                      className="mt-4 inline-flex h-12 w-fit min-w-[11.25rem] max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[linear-gradient(90deg,#198a96_0%,#2aa9b7_56%,#4fc9d2_100%)] px-4 text-[0.78rem] font-semibold text-white shadow-[0_16px_28px_rgba(46,155,184,0.26)] transition-transform group-hover:translate-x-0.5 sm:mt-5 sm:h-[3.2rem] sm:min-w-[14.6rem] sm:px-6 sm:text-[0.96rem]"
                    >
                      <span>Explore more products</span>
                      <ArrowRightIcon className="size-4 shrink-0 text-white" />
                    </span>
                  </div>

                  <div className="relative z-10 flex min-h-[10.2rem] items-center justify-end self-stretch pl-1 sm:min-h-[11.8rem] sm:pl-0">
                    <img
                      src={milletsProductsImage}
                      alt="MilletsNow promotional banner featuring Millets Hai Smart Choice and assorted products"
                      className="block h-auto max-h-[10.3rem] w-full max-w-[11.2rem] object-contain object-right drop-shadow-[0_14px_24px_rgba(20,72,86,0.14)] sm:max-h-[13rem] sm:max-w-[14rem]"
                    />
                  </div>
                </div>
              </a>

              <div className="relative mt-3">
                <ScanSocialSection />
              </div>
            </div>
          </section>
        </div>
      </section>
    </CustomerPageShell>
  )
}

function ScanSocialSection() {
  const items = [
    socialLinks.instagram ? { label: 'Instagram', href: socialLinks.instagram, icon: InstagramMark } : null,
    socialLinks.facebook ? { label: 'Facebook', href: socialLinks.facebook, icon: FacebookMark } : null,
    socialLinks.youtube ? { label: 'YouTube', href: socialLinks.youtube, icon: YouTubeMark } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: SocialIconComponent }>

  return (
    <section className="-mx-1 overflow-hidden rounded-[1.42rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,252,253,0.96))] px-3 py-3.5 shadow-[0_14px_30px_rgba(18,49,61,0.06)] backdrop-blur-[2px]">
      <div className="pointer-events-none absolute left-4 top-4 grid grid-cols-3 gap-1 opacity-55">
        {Array.from({ length: 6 }).map((_, index) => (
          <span key={index} className="size-1 rounded-full bg-[#9ad4e2]" />
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-[1.15rem]">
        {items.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="flex h-[4.375rem] w-[4.375rem] min-w-0 items-center justify-center rounded-[1.2rem] border border-[#d8ebf1] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbfc_100%)] shadow-[0_8px_18px_rgba(20,72,86,0.06)] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-[#9fd4e0] hover:shadow-[0_10px_24px_rgba(46,155,184,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7bc6d9]/35 sm:h-[4.65rem] sm:w-[4.65rem] sm:rounded-[1.25rem]"
            title={label}
          >
            <Icon className="block h-[2.05rem] w-[2.05rem] shrink-0 sm:h-[2.2rem] sm:w-[2.2rem]" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  )
}

type SocialIconProps = React.ComponentProps<'svg'>
type SocialIconComponent = (props: SocialIconProps) => React.ReactNode

function InstagramMark({ className, ...props }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('block shrink-0', className)} {...props}>
      <defs>
        <linearGradient id="scan-instagram-gradient" x1="4.2" y1="19.8" x2="19.8" y2="4.2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.32" stopColor="#fa7e1e" />
          <stop offset="0.62" stopColor="#d62976" />
          <stop offset="0.82" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5.25" fill="url(#scan-instagram-gradient)" />
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

export default CommonFeedbackPage
