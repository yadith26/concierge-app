'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import type { ReactNode } from 'react'
import HeaderProfileButton from '@/components/layout/HeaderProfileButton'

type ManagerHeaderProps = {
  compact: boolean
  title: string
  subtitle?: string
  showLogo?: boolean
  showDate?: boolean
  profileHref?: string
  avatarKey?: string | null
  profilePhotoUrl?: string | null
  headerContent?: ReactNode
  flatBottom?: boolean
  secondaryAction?: {
    icon: ReactNode
    label: string
    count?: number
    onClick: () => void
  } | null
  rightSlot?: ReactNode
}

export default function ManagerHeader({
  compact,
  title,
  subtitle,
  showLogo = false,
  showDate = false,
  profileHref = '/setup-profile',
  avatarKey,
  profilePhotoUrl,
  headerContent,
  flatBottom = false,
  secondaryAction = null,
  rightSlot,
}: ManagerHeaderProps) {
  const locale = useLocale()
  const bottomRadiusClass = flatBottom ? 'rounded-b-none' : 'rounded-b-[36px]'
  const todayLabel = locale === 'es' ? 'Hoy' : 'Today'
  const todayFormatted = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <header className="relative z-30 shrink-0 bg-[#F6F8FC]">
      <div
        className={`relative bg-white shadow-[0_14px_35px_rgba(20,41,82,0.08)] transition-all duration-300 ${bottomRadiusClass} ${
          compact ? 'h-[92px]' : 'min-h-[296px]'
        }`}
      >
        <div className={`absolute inset-0 overflow-hidden ${bottomRadiusClass}`}>
          <Image
            src="/login-illustration-background1.png"
            alt="Fondo Montreal"
            fill
            priority
            sizes="448px"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-[0.98]"
          />
          <div className="absolute inset-0 bg-[#F6F8FC]/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/84 via-white/44 to-[#F6F8FC]/80" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#F6F8FC] to-transparent" />
        </div>

        <div
          className={`relative z-10 flex items-start justify-between px-6 transition-all duration-300 ${
            compact ? 'pt-4' : 'pt-7'
          }`}
        >
          <div className="min-w-0 flex-1">
            {(showLogo || showDate) && (
              <div
                className={`flex min-w-0 items-center transition-all duration-300 ${
                  compact ? 'gap-2 scale-95 origin-left' : 'gap-4'
                }`}
              >
                {showLogo ? (
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(8)].map((_, index) => (
                      <div
                        key={index}
                        className="h-4 w-4 rounded-[4px] bg-[#142952]"
                      />
                    ))}
                  </div>
                ) : null}

                {showDate ? (
                  <span className="truncate text-base font-medium text-[#5E6E8C]">
                    {todayLabel}, {todayFormatted}
                  </span>
                ) : null}
              </div>
            )}

            <div
              className={`overflow-hidden transition-all duration-300 ${
                compact
                  ? showLogo || showDate
                    ? 'mt-0 max-h-0 opacity-0'
                    : 'mt-1 max-h-12 opacity-100'
                  : showLogo || showDate
                    ? 'mt-5 max-h-32 opacity-100'
                    : 'mt-3 max-h-32 opacity-100'
              }`}
            >
              <h1
                className={`line-clamp-2 font-bold leading-none tracking-tight text-[#142952] transition-all duration-300 ${
                  compact ? 'text-[26px]' : 'text-[40px]'
                }`}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className={`line-clamp-1 font-medium text-[#5E6E8C] transition-all duration-300 ${
                    compact ? 'mt-1 text-xs opacity-0' : 'mt-3 text-sm opacity-100'
                  }`}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={`relative flex items-center justify-center border border-[#D9E0EA] bg-white/88 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.1)] backdrop-blur-sm transition-all duration-300 ${
                  compact ? 'h-11 w-11 rounded-[18px]' : 'h-14 w-14 rounded-[24px]'
                }`}
                aria-label={secondaryAction.label}
              >
                {secondaryAction.icon}
                {secondaryAction.count && secondaryAction.count > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D64555] px-1 text-[11px] font-bold leading-none text-white">
                    {secondaryAction.count > 9 ? '9+' : secondaryAction.count}
                  </span>
                ) : null}
              </button>
            ) : null}

            {rightSlot}

            <HeaderProfileButton
              avatarKey={avatarKey}
              compact={compact}
              href={profileHref}
              profilePhotoUrl={profilePhotoUrl}
              variant="manager"
            />
          </div>
        </div>

        {headerContent ? (
          <div
            className={`relative z-10 px-6 pb-6 transition-all duration-300 ${
              compact
                ? 'pointer-events-none max-h-0 translate-y-3 overflow-hidden opacity-0'
                : 'mt-3 max-h-[170px] translate-y-0 opacity-100'
            }`}
          >
            {headerContent}
          </div>
        ) : null}
      </div>
    </header>
  )
}
