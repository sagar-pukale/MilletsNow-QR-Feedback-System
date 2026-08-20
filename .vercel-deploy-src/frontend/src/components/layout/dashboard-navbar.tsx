import { CalendarDaysIcon, LogOutIcon, ShieldCheckIcon } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { NavbarLayout } from '@/components/layout/navbar-layout'
import { useAuth } from '@/context/auth-context'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatIstDateValue(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function formatVisibleDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const utcDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1))

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(utcDate)
}

function DashboardNavbar() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, logout } = useAuth()
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const selectedDate = searchParams.get('date') || formatIstDateValue(new Date())
  const visibleDate = useMemo(() => formatVisibleDate(selectedDate), [selectedDate])

  const openDatePicker = () => {
    const input = dateInputRef.current
    if (!input) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.click()
  }

  return (
    <NavbarLayout className="border-b border-[#d8ebf0] bg-white/88 pl-16 lg:pl-8">
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <div />

        <div className="flex items-center gap-3">
          <input
            ref={dateInputRef}
            type="date"
            aria-label="Select dashboard date"
            value={selectedDate}
            max={formatIstDateValue(new Date())}
            onChange={(event) => {
              const nextValue = event.target.value
              if (!nextValue) return

              const nextParams = new URLSearchParams(searchParams)
              nextParams.set('date', nextValue)
              setSearchParams(nextParams, { replace: true })
            }}
            className="sr-only"
          />
          <button
            type="button"
            onClick={openDatePicker}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8eaef] bg-[#f4fbfd] px-3 py-2 text-xs font-semibold text-[#49646d] transition hover:border-[#c6e3ea] hover:bg-[#edf8fb]"
          >
            <CalendarDaysIcon className="size-3.5 text-[#2e9bb8]" />
            <span>{visibleDate}</span>
          </button>

          <div className="flex items-center gap-2 rounded-[999px] border border-[#d8eaef] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,252,253,0.98))] px-2 py-2 shadow-[0_12px_28px_rgba(22,84,96,0.06)] sm:gap-3 sm:pl-2.5 sm:pr-2.5">
            <div className="relative shrink-0">
              <div className="flex size-11 items-center justify-center rounded-full bg-[linear-gradient(145deg,#0e8fb0_0%,#2e9bb8_48%,#78d2e3_100%)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(46,155,184,0.28)]">
                {initials(user?.fullName || 'Admin')}
              </div>
              <span className="absolute bottom-0.5 right-0.5 block size-3 rounded-full border-2 border-white bg-[#22c55e] shadow-[0_4px_10px_rgba(34,197,94,0.28)]" />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#20323a]">
                {user?.fullName || 'MilletsNow Administrator'}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#667b83]">
                <span className="truncate">admin</span>
                <span className="text-[#b2c6cd]">|</span>
                <ShieldCheckIcon className="size-3.5 shrink-0 text-[#2e9bb8]" />
                <span className="truncate font-medium text-[#5e747c]">{user?.role || 'Administrator'}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Logout"
              className="size-10 rounded-[1rem] border border-[#cfe6ee] bg-[linear-gradient(145deg,#0e8fb0_0%,#2e9bb8_52%,#71cbdf_100%)] text-white shadow-[0_12px_24px_rgba(46,155,184,0.22)] hover:border-[#b9dce6] hover:text-white hover:brightness-[1.03]"
              onClick={() => {
                void logout().then(() => navigate('/login', { replace: true }))
              }}
            >
              <LogOutIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </NavbarLayout>
  )
}

export { DashboardNavbar }
