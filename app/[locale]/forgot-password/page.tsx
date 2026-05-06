'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const t = useTranslations()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [loading, setLoading] = useState(false)

  const getFriendlyErrorMessage = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase()

    if (msg.includes('rate limit')) {
      return t('auth.forgotPassword.rateLimitError')
    }

    return t('auth.forgotPassword.genericError')
  }

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage('')
    setMessageType('')
    setLoading(true)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/update-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      setMessage(getFriendlyErrorMessage(error.message))
      setMessageType('error')
      console.error('RESET ERROR:', error)
    } else {
      setMessage(t('auth.forgotPassword.success'))
      setMessageType('success')
      setEmail('')
    }

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
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
            <div className="h-4 w-4 rounded-sm bg-[#142952]" />
          </div>

          <span className="text-[32px] font-semibold tracking-tight text-[#142952]">
            Conciergo
          </span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-3 text-[30px] font-semibold tracking-tight text-[#142952]">
            {t('auth.forgotPassword.title')}
          </h1>
          <p className="mx-auto max-w-[320px] text-[17px] leading-7 text-[#5E6E8C]">
            {t('auth.forgotPassword.subtitle')}
          </p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-5">
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98A4B8]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 7.5v9A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5v-9m19.5 0A2.25 2.25 0 0019.5 5.25h-15A2.25 2.25 0 002.25 7.5m19.5 0l-8.69 5.516a2 2 0 01-2.12 0L2.25 7.5"
                />
              </svg>
            </div>

            <input
              type="email"
              placeholder={t('auth.forgotPassword.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-16 w-full rounded-2xl border border-[#D9E0EA] bg-white pl-14 pr-4 text-[18px] text-[#33415C] outline-none transition focus:border-[#2F66C8] focus:ring-2 focus:ring-[#2F66C8]/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-14 w-full rounded-2xl bg-[#2F66C8] text-[20px] font-semibold text-white shadow-[0_10px_24px_rgba(47,102,200,0.22)] transition hover:bg-[#2859b2] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? t('auth.forgotPassword.sending')
              : t('auth.forgotPassword.sendLink')}
          </button>
        </form>

        {message && (
          <p
            className={`mt-5 rounded-2xl px-4 py-3 text-center text-sm font-medium ${
              messageType === 'success'
                ? 'border border-[#D8E9DB] bg-[#F3FBF5] text-[#1F7A3D]'
                : 'border border-[#F1D3D3] bg-[#FFF5F5] text-[#C53030]'
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-block text-[16px] font-medium text-[#2F66C8] underline underline-offset-4"
          >
            {t('auth.forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </main>
  )
}