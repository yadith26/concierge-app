'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Building2, ChevronRight, Loader2, MessageSquareMore, X } from 'lucide-react'
import type { RecentBuildingConversation } from '@/lib/messages/messageService'

type GlobalMessagesInboxModalProps = {
  open: boolean
  conversations: RecentBuildingConversation[]
  loading?: boolean
  onClose: () => void
  onSelect: (conversation: RecentBuildingConversation) => void
}

function formatRelativeTime(
  dateString: string,
  locale: string,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return t('relative.now')
  if (diffMs < hour) {
    return t('relative.minutes', { count: Math.floor(diffMs / minute) })
  }
  if (diffMs < day) {
    return t('relative.hours', { count: Math.floor(diffMs / hour) })
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U'
}

export default function GlobalMessagesInboxModal({
  open,
  conversations,
  loading = false,
  onClose,
  onSelect,
}: GlobalMessagesInboxModalProps) {
  const t = useTranslations('globalMessagesInboxModal')
  const locale = useLocale()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="flex h-[min(78vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF3F8] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C9AB3]">
              {t('eyebrow')}
            </p>
            <h3 className="mt-1 truncate text-xl font-bold text-[#142952]">
              {t('title')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] p-2 text-[#6E7F9D]"
            aria-label={t('close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#FBFCFF] px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 rounded-[24px] border border-[#E7EDF5] bg-white px-4 py-5 text-sm text-[#7B8BA8]">
              <Loader2 size={16} className="animate-spin" />
              {t('loading')}
            </div>
          ) : null}

          {!loading && conversations.length === 0 ? (
            <div className="rounded-[24px] border border-[#E7EDF5] bg-white px-4 py-5 text-sm leading-6 text-[#7B8BA8]">
              {t('empty')}
            </div>
          ) : null}

          {!loading ? (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <button
                  key={`${conversation.building_id}-${conversation.contact_id}`}
                  type="button"
                  onClick={() => onSelect(conversation)}
                  className="w-full rounded-[24px] border border-[#E3EAF3] bg-white px-4 py-4 text-left shadow-sm transition hover:border-[#C7D8F5] hover:bg-[#FBFCFE]"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF4FF] text-sm font-bold text-[#2F66C8]">
                      {conversation.contact_profile_photo_url ? (
                        <span
                          aria-label={conversation.contact_name}
                          className="h-full w-full bg-cover bg-center"
                          role="img"
                          style={{
                            backgroundImage: `url(${conversation.contact_profile_photo_url})`,
                          }}
                        />
                      ) : (
                        getInitial(conversation.contact_name)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#142952]">
                            {conversation.contact_name}
                          </p>
                          <p className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-semibold text-[#6E7F9D]">
                            <Building2 size={13} />
                            <span className="truncate">
                              {conversation.building_name}
                            </span>
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {conversation.unread_count > 0 ? (
                            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#D64555] px-2 py-1 text-[11px] font-bold text-white">
                              {conversation.unread_count > 9
                                ? '9+'
                                : conversation.unread_count}
                            </span>
                          ) : null}
                          <span className="text-[11px] font-medium text-[#8C9AB3]">
                            {formatRelativeTime(conversation.last_message_at, locale, t)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 truncate text-sm text-[#4F5F7D]">
                        {conversation.last_message_body}
                      </p>
                    </div>

                    <ChevronRight className="mt-4 shrink-0 text-[#9AA8BF]" size={18} />
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#EEF3F8] bg-white px-5 py-3 text-xs leading-5 text-[#7B8BA8]">
          <div className="flex items-center gap-2">
            <MessageSquareMore size={15} />
            {t('footer')}
          </div>
        </div>
      </div>
    </div>
  )
}
