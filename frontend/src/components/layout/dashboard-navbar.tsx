import {
  BellIcon,
  Building2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  SearchIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NavbarLayout } from '@/components/layout/navbar-layout'

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="relative hidden shrink-0 md:block">
      <span className="sr-only">{label}</span>
      <select
        defaultValue={options[0]}
        className="h-10 appearance-none rounded-xl border border-border bg-card py-2 pr-8 pl-3 text-xs font-semibold text-foreground shadow-xs outline-none transition-colors hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
    </label>
  )
}

function DashboardNavbar() {
  const currentDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  return (
      <NavbarLayout className="pl-16 lg:pl-8">
      <div className="flex w-full min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-[230px] lg:max-w-[280px]">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search dashboard"
            placeholder="Search..."
            className="h-10 rounded-xl border-transparent bg-secondary pl-9 pr-3 shadow-none focus-visible:border-primary/25 focus-visible:bg-card"
          />
        </div>

        <FilterSelect label="Product filter" options={['All products', 'Ragi Flour', 'Bajra Atta']} />
        <FilterSelect label="Time filter" options={['Last 30 days', 'Last 7 days', 'This year']} />

        <Button type="button" variant="outline" size="sm" className="hidden h-10 shrink-0 gap-2 lg:inline-flex">
          <CalendarDaysIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <span>01 May – 14 May</span>
        </Button>

        <div className="hidden items-center gap-2 border-l pl-3 text-xs font-bold text-foreground xl:flex">
          <Building2Icon aria-hidden="true" className="size-4 text-primary" />
          MilletsNow Foods
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="View notifications"
          className="relative shrink-0 rounded-xl text-muted-foreground hover:text-primary"
        >
          <BellIcon aria-hidden="true" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-danger ring-2 ring-card" />
        </Button>

        <div className="hidden shrink-0 items-center gap-2 border-l pl-3 sm:flex">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 ring-4 ring-brand-50">
            AS
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-xs font-bold text-foreground">Arjun Sharma</p>
            <p className="truncate text-[10px] font-medium text-muted-foreground">Administrator</p>
          </div>
          <ChevronDownIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <span className="sr-only">Current date: {currentDate}</span>
    </NavbarLayout>
  )
}

export { DashboardNavbar }
