'use client'

import { MailOpen, MessageSquareMore } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { BuildingMessage } from '@/lib/messages/messageService'

type DashboardMessagesModalProps = {
  open: boolean
  messages: BuildingMessage[]
  unreadCount: number
  onClose: () => void
  onMarkAsRead: (messageId: string) => void
}

export default function DashboardMessagesModal({
  open,
  messages,
  unreadCount,
  onClose,
  onMarkAsRead,
}: DashboardMessagesModalProps) {
  const t = useTranslations('dashboardMessagesModal')
  const locale = useLocale()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="w-full max-w-md rounded-[30px] bg-white p-5 shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1 text-[#2F66C8]">
              <MessageSquareMore size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-[#142952]">{t('title')}</h3>
              <p className="mt-1 text-sm text-[#6E7F9D]">
                {unreadCount > 0
                  ? t('unreadCount', { count: unreadCount })
                  : t('allRead')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] px-3 py-2 text-sm font-semibold text-[#6E7F9D]"
          >
            {t('close')}
          </button>
        </div>

        <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="rounded-[24px] border border-[#E7EDF5] bg-[#FBFCFE] px-4 py-5 text-sm text-[#7B8BA8]">
              {t('empty')}
            </div>
          ) : null}

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
      </div>
    </div>
  )
}
