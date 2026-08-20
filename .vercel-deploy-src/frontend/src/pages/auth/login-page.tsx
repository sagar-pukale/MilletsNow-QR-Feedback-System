import { useEffect, useState } from 'react'
import { EyeIcon, EyeOffIcon, Loader2Icon, LockKeyholeIcon, UserRoundIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type AuthUser } from '@/context/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { apiPath } from '@/lib/api'
import milletsNowLogo from '@/assets/milletsnow-logo.jpeg'

const schema = z.object({
  email: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  })

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [navigate, user])

  const onSubmit = async (values: FormValues) => {
    setServerError('')

    try {
      const response = await fetch(apiPath('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      })

      const body = (await response.json().catch(() => null)) as { user?: AuthUser; error?: string } | null
      if (!response.ok || !body?.user) throw new Error(body?.error ?? 'Unable to sign in.')

      loginSuccess(body.user)
      const target = new URLSearchParams(location.search).get('redirect') || '/dashboard'
      navigate(target, { replace: true })
    } catch (reason) {
      setServerError(
        reason instanceof TypeError
          ? 'Backend unavailable. Please try again.'
          : reason instanceof Error
            ? reason.message
            : 'Unable to sign in.',
      )
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7fcfd_0%,#f3fafc_54%,#ffffff_100%)] px-4 py-6 sm:px-6">
      <section className="w-full max-w-[27rem]">
        <div className="w-full rounded-[1.85rem] border border-[#dbecef] bg-white px-5 py-6 shadow-[0_18px_46px_rgba(18,70,82,0.07)] sm:px-8 sm:py-8">
          <div className="flex flex-col items-center text-center">
            <img src={milletsNowLogo} alt="MilletsNow" className="h-auto w-[132px] object-contain sm:w-[148px]" />
            <h1 className="mt-5 text-[1.8rem] font-bold tracking-tight text-[#20323a] sm:text-[1.95rem]">Admin Login</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
              <div>
                <Label htmlFor="email" className="text-[#29434c]">Email or username</Label>
                <div className="relative mt-2">
                  <UserRoundIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6f858d]" />
                  <Input
                    id="email"
                    autoComplete="username"
                    placeholder="you@milletsnow.com"
                    className="h-12 rounded-[1rem] border-[#d7e7eb] bg-[#fbfeff] pl-11 pr-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                    {...register('email')}
                  />
                </div>
                {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
              </div>

              <div>
                <Label htmlFor="password" className="text-[#29434c]">Password</Label>
                <div className="relative mt-2">
                  <LockKeyholeIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6f858d]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 rounded-[1rem] border-[#d7e7eb] bg-[#fbfeff] pl-11 pr-11 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6f858d] transition hover:text-[#2e9bb8]"
                  >
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
                {errors.password ? <p className="mt-1 text-xs text-destructive">{errors.password.message}</p> : null}
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex items-center gap-2 text-sm text-[#516770]">
                  <input type="checkbox" className="size-4 rounded border-[#c7dde4]" {...register('rememberMe')} />
                  Remember me
                </label>
                <span className="text-sm font-semibold text-[#2e9bb8]">Admin access</span>
              </div>

              {serverError ? (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {serverError}
                </p>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full rounded-[1rem] bg-[linear-gradient(135deg,#0f86a6_0%,#2e9bb8_52%,#69c8dc_100%)] text-base text-white shadow-[0_18px_34px_rgba(46,155,184,0.24)] hover:brightness-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2Icon className="size-4 animate-spin" /> : null}
                {isSubmitting ? 'Signing in...' : 'Login'}
              </Button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
