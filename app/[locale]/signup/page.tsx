'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'

type UserRole = 'concierge' | 'manager'

export default function SignupPage() {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('concierge')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [loading, setLoading] = useState(false)

  const normalizedEmail = email.trim().toLowerCase()

  const getFriendlyErrorMessage = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase()

    if (msg.includes('rate limit')) {
      return t('register.rateLimitError')
    }

    if (msg.includes('already registered')) {
      return 'Este correo ya esta registrado. Si aun no puedes iniciar sesion, revisa tu correo de confirmacion o usa el boton para reenviarlo.'
    }

    if (msg.includes('password')) {
      return t('register.passwordError')
    }

    if (msg.includes('invalid email')) {
      return t('register.invalidEmail')
    }

    return t('register.genericError')
  }

  const resendConfirmationEmail = async () => {
    if (!normalizedEmail) {
      setMessage('Escribe el correo para reenviar la confirmacion.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/login`
        : undefined

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      setMessage(`No se pudo reenviar la confirmacion: ${error.message}`)
      setMessageType('error')
      setLoading(false)
      return
    }

    setMessage('Te enviamos otro correo de confirmacion.')
    setMessageType('success')
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setMessageType('')

    if (password !== confirmPassword) {
      setMessage(t('register.passwordMismatch'))
      setMessageType('error')
      return
    }

    setLoading(true)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/login`
        : undefined

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          role,
          locale,
        },
      },
    })

    if (error) {
      setMessage(getFriendlyErrorMessage(error.message))
      setMessageType('error')
      setLoading(false)
      return
    }

    if (data.session === null) {
      setMessage(t('register.checkEmail'))
    } else {
      setMessage(t('register.success'))
      setTimeout(() => {
        router.replace('/setup-profile')
      }, 800)
    }

    setMessageType('success')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRole('concierge')
    setLoading(false)
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

          <span className="text-[32px] font-semibold text-[#142952]">
            Conciergo
          </span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-3 text-[30px] font-semibold text-[#142952]">
            {t('register.title')}
          </h1>
          <p className="text-[17px] text-[#5E6E8C]">
            {t('register.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder={t('register.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            required
            className="h-16 rounded-2xl border px-4 text-[18px] focus:border-[#2F66C8]"
          />

          <input
            type="password"
            placeholder={t('register.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="new-password"
            spellCheck={false}
            required
            className="h-16 rounded-2xl border px-4 text-[18px] focus:border-[#2F66C8]"
          />

          <input
            type="password"
            placeholder={t('register.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="new-password"
            spellCheck={false}
            required
            className="h-16 rounded-2xl border px-4 text-[18px] focus:border-[#2F66C8]"
          />

          <div className="rounded-2xl border border-[#D9E0EA] bg-white p-3">
            <p className="mb-3 text-sm font-semibold text-[#142952]">
              Tipo de cuenta
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('concierge')}
                className={`rounded-2xl border px-3 py-4 text-left transition ${
                  role === 'concierge'
                    ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                    : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
                }`}
              >
                <span className="block text-base font-semibold">Conserje</span>
                <span className="mt-1 block text-xs leading-5">
                  Crea tareas, agenda e inventario.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`rounded-2xl border px-3 py-4 text-left transition ${
                  role === 'manager'
                    ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                    : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
                }`}
              >
                <span className="block text-base font-semibold">Manager</span>
                <span className="mt-1 block text-xs leading-5">
                  Ve edificios y crea solicitudes.
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 rounded-2xl bg-[#2F66C8] text-white text-[20px] font-semibold"
          >
            {loading
              ? t('register.creating')
              : t('register.createAccount')}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={resendConfirmationEmail}
            className="h-12 rounded-2xl border border-[#D9E0EA] bg-white text-[16px] font-semibold text-[#2F66C8] disabled:opacity-70"
          >
            Reenviar correo de confirmacion
          </button>
        </form>

        {message && (
          <div
            className={`mt-5 rounded-2xl px-4 py-3 text-center text-sm ${
              messageType === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-[#6E7F9D]">
            {t('register.haveAccount')}
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block text-[#2F66C8] font-semibold underline"
          >
            {t('register.signIn')}
          </Link>
        </div>
      </div>
    </main>
  )
}
