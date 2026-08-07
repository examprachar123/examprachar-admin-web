import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    try {
      await login(values.username, values.password)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm rounded-[20px] border-[1.5px] border-border bg-white p-8 shadow-[0_4px_12px_rgba(79,70,229,0.04)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to">
            <Icon icon={faLock} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-heading">Examprachar Admin</h1>
          <p className="mt-1 text-sm text-body-subtle">Sign in to manage exam updates.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-body">
              Username
            </label>
            <div className="relative">
              <Icon icon={faUser} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body-subtle" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                {...register('username')}
                className="w-full rounded-xl border border-input-border py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-error">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-body">
              Password
            </label>
            <div className="relative">
              <Icon icon={faLock} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body-subtle" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-xl border border-input-border py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
