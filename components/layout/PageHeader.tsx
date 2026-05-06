'use client'

import Image from 'next/image'
import type {ReactNode} from 'react'
import HeaderProfileButton from '@/components/layout/HeaderProfileButton'

type PageHeaderProps = {
  compact: boolean
  title: string
  showUserButton?: boolean
  secondaryAction?: {
    icon: ReactNode
    label: string
    count?: number
    onClick: () => void
  } | null
  rightSlot?: ReactNode
  children?: ReactNode
  avatarEmoji?: string
  avatarKey?: string | null
  profilePhotoUrl?: string | null
  expandedHeightClass?: string
  compactHeightClass?: string
  expandedTitleClass?: string
  compactTitleClass?: string
}

export default function PageHeader({
  compact,
  title,
  showUserButton = true,
  secondaryAction = null,
  rightSlot,
  children,
  avatarEmoji,
  avatarKey,
  profilePhotoUrl,
  expandedHeightClass = 'min-h-[300px]',
  compactHeightClass = 'h-[96px]',
  expandedTitleClass = 'pt-3 text-[42px] leading-none',
  compactTitleClass = 'pt-1 text-[26px] leading-none',
}: PageHeaderProps) {
  return (
    <header className="relative z-30 shrink-0 bg-[#F6F8FC]">
      <div
        className={`relative transition-all duration-300 ${
          compact ? compactHeightClass : expandedHeightClass
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/login-illustration-background1.png"
            alt="Fondo Montreal"
            fill
            priority
            sizes="448px"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-[0.92]"
          />

          <div className="absolute inset-0 bg-white/35" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#F6F8FC] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#F6F8FC] to-transparent" />
        </div>

        <div className="relative z-10 h-full px-4 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <h1
              className={`font-bold tracking-tight text-[#142952] transition-all duration-300 ${
                compact ? compactTitleClass : expandedTitleClass
              }`}
            >
              {title}
            </h1>

            <div className="flex items-center gap-2">
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className={`relative rounded-[22px] border border-[#D9E0EA] bg-white/88 text-[#6E7F9D] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm transition-all duration-300 hover:bg-white ${
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

              {showUserButton && (
                <HeaderProfileButton
                  avatarEmoji={avatarEmoji}
                  avatarKey={avatarKey}
                  compact={compact}
                  profilePhotoUrl={profilePhotoUrl}
                />
              )}
            </div>
          </div>

          <div
            className={`transition-all duration-300 ${
              compact
                ? 'mt-0 max-h-0 overflow-hidden opacity-0'
                : 'mt-4 max-h-[220px] opacity-100'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </header>
  )
}
