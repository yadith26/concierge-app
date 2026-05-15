'use client'

import { useLocale, useTranslations } from 'next-intl'
import { MailOpen, MessageSquareMore } from 'lucide-react'
import type { BuildingMessage } from '@/lib/messages/messageService'

type DashboardInboxSectionProps = {
  messages: BuildingMessage[]
  unreadCount: number
  onMarkAsRead: (messageId: string) => void
}

export default function DashboardInboxSection({
  messages,
  unreadCount,
  onMarkAsRead,
}: DashboardInboxSectionProps) {
  const t = useTranslations('dashboardInboxSection')
  const locale = useLocale()

  if (!messages.length) return null

  return (
    <section className="mt-4 rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#142952]">
          <MessageSquareMore size={20} className="text-[#2F66C8]" />
          <div>
            <h2 className="text-base font-bold">{t('title')}</h2>
            <p className="text-xs text-[#7B8BA8]">
              {unreadCount > 0
                ? t('unreadCount', { count: unreadCount })
                : t('allRead')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-[24px] border px-4 py-4 ${
              message.read_at
                ? 'border-[#E7EDF5] bg-[#FBFCFE]'
                : 'border-[#D7E3F7] bg-[#F7FAFF]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#142952]">
                  {message.sender_name}
                </p>
                <p className="mt-1 text-xs text-[#7B8BA8]">
                  {new Intl.DateTimeFormat(locale, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(new Date(message.created_at))}
                </p>
              </div>

              {!message.read_at ? (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(message.id)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#2F66C8] shadow-sm"
                >
                  <MailOpen size={14} />
                  {t('markAsRead')}
                </button>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-6 text-[#4E5F7C]">{message.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
