'use client'

import { ChevronRight, MessageSquareMore } from 'lucide-react'
import type { RecentBuildingConversation } from '@/lib/messages/messageService'

type ManagerRecentMessagesProps = {
  items: RecentBuildingConversation[]
  loading?: boolean
  onOpenConversation: (item: RecentBuildingConversation) => void
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'Ahora'
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min`
  if (diffMs < day) return `${Math.floor(diffMs / hour)} h`

  return new Intl.DateTimeFormat('es', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function ManagerRecentMessages({
  items,
  loading = false,
  onOpenConversation,
}: ManagerRecentMessagesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8C9AB3]">
            Actividad reciente
          </p>
          <h2 className="mt-1 text-[24px] font-bold tracking-tight text-[#142952]">
            Mensajes recientes
          </h2>
        </div>

        <div className="rounded-full bg-[#EEF4FF] p-2 text-[#2F66C8]">
          <MessageSquareMore size={18} />
        </div>
      </div>

      {loading ? (
        <div className="rounded-[24px] border border-[#E3EAF3] bg-white p-5 text-sm leading-6 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
          Cargando mensajes recientes...
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-[24px] border border-[#E3EAF3] bg-white p-5 text-sm leading-6 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
          Aun no tienes conversaciones recientes.
        </div>
      ) : null}

      {!loading &&
        items.map((item) => (
          <button
            key={`${item.building_id}-${item.contact_id}`}
            type="button"
            onClick={() => onOpenConversation(item)}
            className="w-full rounded-[24px] border border-[#E3EAF3] bg-white px-4 py-4 text-left shadow-[0_10px_28px_rgba(20,41,82,0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(20,41,82,0.10)]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF4FF] text-sm font-bold text-[#2F66C8]">
                {item.contact_profile_photo_url ? (
                  <span
                    aria-label={item.contact_name}
                    className="h-full w-full bg-cover bg-center"
                    role="img"
                    style={{
                      backgroundImage: `url(${item.contact_profile_photo_url})`,
                    }}
                  />
                ) : (
                  item.contact_name.trim().charAt(0).toUpperCase() || 'U'
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#142952]">
                      {item.contact_name}
                    </p>
                    <p className="truncate text-xs font-semibold text-[#6E7F9D]">
                      {item.building_name}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {item.unread_count > 0 ? (
                      <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#D64555] px-2 py-1 text-[11px] font-bold text-white">
                        {item.unread_count > 9 ? '9+' : item.unread_count}
                      </span>
                    ) : null}

                    <span className="text-[11px] font-medium text-[#8C9AB3]">
                      {formatRelativeTime(item.last_message_at)}
                    </span>
                  </div>
                </div>

                <p className="mt-2 truncate text-sm text-[#4F5F7D]">
                  {item.last_message_body}
                </p>
              </div>

              <ChevronRight className="shrink-0 text-[#9AA8BF]" size={20} />
            </div>
          </button>
        ))}
    </section>
  )
}
