'use client'

import Image from 'next/image'
import {useLocale, useTranslations} from 'next-intl'
import type {ReactNode} from 'react'
import HeaderProfileButton from '@/components/layout/HeaderProfileButton'

type AppHeaderProps = {
  compact?: boolean
  title?: string
  subtitle?: string
  showGreeting?: boolean
  userName?: string
  showDate?: boolean
  rightIconLink?: string
  avatarKey?: string | null
  profilePhotoUrl?: string | null
  headerContent?: ReactNode
  secondaryAction?: {
    icon: ReactNode
    label: string
    count?: number
    onClick: () => void
  } | null
  rightSlot?: ReactNode
}

export default function AppHeader({
  compact = false,
  title,
  subtitle,
  showGreeting = false,
  userName = '',
  showDate = true,
  rightIconLink = '/setup-profile',
  avatarKey,
  profilePhotoUrl,
  headerContent,
  secondaryAction = null,
  rightSlot,
}: AppHeaderProps) {
  const t = useTranslations('appHeader')
  const locale = useLocale()

  const todayDate = new Date()
  const todayFormatted = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
  }).format(todayDate)

  const todayText = `${t('today')}, ${todayFormatted}`

  const mainTitle =
    title || (showGreeting ? `${t('hello')}, ${userName || t('user')}` : '')

  const showLargeText = !!mainTitle || !!subtitle
  const expandedHeight = headerContent ? 'h-[300px]' : 'h-[190px]'

  return (
    <header className="relative shrink-0 bg-[#F6F8FC]">
      <div
        className={`relative transition-all duration-300 ${
          compact ? 'h-[72px]' : expandedHeight
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/login-illustration-background1.png"
            alt="Fondo Montreal"
            fill
            priority
            sizes="448px"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${
              compact ? 'object-top opacity-[0.9]' : 'object-top opacity-[0.95]'
            }`}
          />

          <div className="absolute inset-0 bg-[#F6F8FC]/12" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#F6F8FC] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#F6F8FC] to-transparent" />
        </div>

        <div
          className={`relative z-10 flex items-start justify-between px-5 transition-all duration-300 ${
            compact ? 'pt-3' : 'pt-5'
          }`}
        >
          <div className="min-w-0 flex-1">
            {showDate && (
              <div
                className={`origin-left flex items-center transition-all duration-300 ${
                  compact ? 'scale-95 gap-2' : 'scale-100 gap-3'
                }`}
              >
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                  <div className="h-3 w-3 rounded-[3px] bg-[#142952]" />
                </div>

                <span className="text-sm font-medium text-[#5E6E8C]">
                  {todayText}
                </span>
              </div>
            )}

            {showLargeText && (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  compact
                    ? 'mt-0 max-h-0 opacity-0'
                    : 'mt-3 max-h-24 opacity-100'
                }`}
              >
                <h1 className="line-clamp-2 text-[36px] font-bold leading-[0.95] tracking-tight text-[#142952]">
                  {mainTitle}
                </h1>

                {subtitle ? (
                  <p className="mt-2 line-clamp-2 text-[15px] font-semibold leading-5 text-[#425979]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction ? (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={`relative shrink-0 rounded-[22px] border border-[#D9E0EA] bg-white/85 text-[#6E7F9D] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm transition-all duration-300 hover:bg-white ${
                  compact
                    ? 'flex h-11 w-11 items-center justify-center'
                    : 'flex h-14 w-14 items-center justify-center'
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
              href={rightIconLink}
              profilePhotoUrl={profilePhotoUrl}
            />
          </div>
        </div>

        {headerContent ? (
          <div
            className={`relative z-20 px-5 transition-all duration-300 ${
              compact
                ? 'pointer-events-none max-h-0 translate-y-3 overflow-hidden opacity-0'
                : 'mt-3 max-h-[120px] translate-y-0 opacity-100'
            }`}
          >
            {headerContent}
          </div>
        ) : null}
      </div>
    </header>
  )
}
