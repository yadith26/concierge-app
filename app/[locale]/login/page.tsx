'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [loading, setLoading] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  const getFriendlyLoginMessage = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase()

    if (msg.includes('invalid login credentials')) {
      return t('auth.login.invalidCredentials')
    }

    if (msg.includes('email not confirmed')) {
      return 'Tu correo existe, pero todavia no esta confirmado. Revisa tu email o vuelve a la pantalla de registro para reenviar la confirmacion.'
    }

    return `${t('auth.login.genericError')}: ${errorMessage}`
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setMessageType('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      setMessage(getFriendlyLoginMessage(error.message))
      setMessageType('error')
      setLoading(false)
      return
    }

    setMessage(t('auth.login.success'))
    setMessageType('success')

    const userRole = data.user?.user_metadata?.role
    const { data: profile, error: profileError } = data.user
      ? await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
      : { data: null, error: null }

    if (profileError) {
      setMessage(t('auth.login.genericError'))
      setMessageType('error')
      setLoading(false)
      return
    }

    const nextPath = !profile
      ? '/setup-profile'
      : profile.role === 'manager' || userRole === 'manager'
        ? '/manager'
        : '/dashboard'

    setTimeout(() => {
      router.replace(nextPath)
    }, 800)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-6 py-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-[-20px] flex justify-center">
        <img
          src="/login-illustration.png"
          alt="Decoración Conciergo"
          className="w-full max-w-md opacity-[0.50]"
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-sm flex-col">
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="grid grid-cols-3 gap-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 w-4 rounded-sm bg-[#142952]" />
            ))}
          </div>

          <span className="text-[32px] font-semibold tracking-tight text-[#142952]">
            Conciergo
          </span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-3 text-[30px] font-semibold tracking-tight text-[#142952]">
            {t('auth.login.title')}
          </h1>
          <p className="mx-auto max-w-[320px] text-[17px] leading-7 text-[#5E6E8C]">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder={t('auth.login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            required
            className="h-16 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[18px] outline-none focus:border-[#2F66C8]"
          />

          <input
            type="password"
            placeholder={t('auth.login.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="current-password"
            spellCheck={false}
            required
            className="h-16 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[18px] outline-none focus:border-[#2F66C8]"
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[15px] text-[#6E7F9D] hover:text-[#2F66C8]"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#2F66C8] text-[20px] font-semibold text-white transition hover:bg-[#2859b2] disabled:opacity-70"
          >
            {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </button>
        </form>

        {message && (
          <div
            className={`mt-5 rounded-2xl px-4 py-3 text-center text-sm font-medium ${
              messageType === 'success'
                ? 'border border-[#D8E9DB] bg-[#F3FBF5] text-[#1F7A3D]'
                : 'border border-[#F1D3D3] bg-[#FFF5F5] text-[#C53030]'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-[16px] text-[#6E7F9D]">
            {t('auth.login.noAccount')}
          </p>

          <Link
            href="/signup"
            className="mt-2 inline-block text-[18px] font-semibold text-[#2F66C8] underline"
          >
            {t('auth.login.signUp')}
          </Link>
        </div>
      </div>
    </main>
  )
}
