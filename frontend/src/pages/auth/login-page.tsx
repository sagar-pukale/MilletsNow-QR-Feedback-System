import { useEffect, useState } from 'react'
import { EyeIcon, EyeOffIcon, Loader2Icon, WheatIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type AuthUser } from '@/context/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { apiPath } from '@/lib/api'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

function LoginPage() {
  const { user, loginSuccess } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const onSubmit = async (values: FormValues) => {
    setServerError('')
    try {
      const response = await fetch(apiPath('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })
      const body = (await response.json().catch(() => null)) as { user?: AuthUser; error?: string } | null
      if (!response.ok || !body?.user) {
        throw new Error(body?.error ?? 'Unable to sign in')
      }
      loginSuccess(body.user)
      const target = new URLSearchParams(location.search).get('redirect') || '/dashboard'
      navigate(target, { replace: true })
    } catch (error) {
      setServerError(
        error instanceof TypeError
          ? 'Backend unavailable. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Unable to sign in',
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-7 shadow-card">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-white">
            <WheatIcon />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your MilletsNow workspace.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="mt-2"
              {...register('email')}
            />
            {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            {errors.password ? <p className="mt-1 text-xs text-destructive">{errors.password.message}</p> : null}
          </div>
          {serverError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <Link
          to="/scan/MN-LADO-00001"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-primary"
        >
          Open customer QR experience
        </Link>
      </div>
    </main>
  )
}

export default LoginPage
