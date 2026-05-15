'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPlus,
  Loader2,
  Send,
  Smile,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react'
import type { BuildingMessage } from '@/lib/messages/messageService'

type MessageReaction = 'like' | 'laugh' | 'done'

type ConversationModalProps = {
  open: boolean
  title: string
  subtitle?: string
  currentUserId: string
  messages: BuildingMessage[]
  value: string
  locale?: string
  sending?: boolean
  loading?: boolean
  error?: string
  canSaveAsTask?: boolean
  savingTaskMessageId?: string | null
  onSaveAsTask?: (message: BuildingMessage) => void | Promise<void>
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function ConversationModal({
  open,
  title,
  subtitle,
  currentUserId,
  messages,
  value,
  locale = 'es',
  sending = false,
  loading = false,
  error = '',
  canSaveAsTask = false,
  savingTaskMessageId = null,
  onSaveAsTask,
  onChange,
  onClose,
  onSubmit,
}: ConversationModalProps) {
  const t = useTranslations('conversationModal')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [messageReactions, setMessageReactions] = useState<
    Record<string, MessageReaction>
  >({})

  const trimmedValue = value.trim()
  const canSend = trimmedValue.length > 0 && !sending && !loading

  useEffect(() => {
    if (!open) return

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [open, messages, sending])

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    [locale]
  )

  function handleSubmit() {
    if (!canSend) return
    onSubmit()
  }

  function handleComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  function handleMessageKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    messageId: string
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    setActiveMessageId((current) => (current === messageId ? null : messageId))
  }

  function handleReactionClick(
    event: React.MouseEvent<HTMLButtonElement>,
    messageId: string,
    reaction: MessageReaction
  ) {
    event.stopPropagation()
    setMessageReactions((current) => ({
      ...current,
      [messageId]: reaction,
    }))
    setActiveMessageId(null)
  }

  function handleSaveAsTaskClick(
    event: React.MouseEvent<HTMLButtonElement>,
    message: BuildingMessage
  ) {
    event.stopPropagation()
    setActiveMessageId(null)
    void onSaveAsTask?.(message)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="flex h-[min(78vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF3F8] px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-[#142952]">{title}</h3>
            {subtitle ? (
              <p className="mt-1 truncate text-sm text-[#6E7F9D]">{subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] p-2 text-[#6E7F9D]"
            aria-label={t('closeConversation')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[#FBFCFF] px-4 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#7B8BA8]">
              <Loader2 size={16} className="animate-spin" />
              <span>{t('loading')}</span>
            </div>
          ) : null}

          {!loading && messages.length === 0 ? (
            <div className="rounded-[24px] border border-[#E7EDF5] bg-white px-4 py-5 text-sm text-[#7B8BA8]">
              {t('empty')}
            </div>
          ) : null}

          {!loading &&
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId
              const isActive = activeMessageId === message.id
              const isSavingThisMessage = savingTaskMessageId === message.id
              const selectedReaction = messageReactions[message.id]
              const canCreateTaskFromMessage =
                !isOwn && canSaveAsTask && Boolean(onSaveAsTask)

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setActiveMessageId((current) =>
                        current === message.id ? null : message.id
                      )
                    }
                    onKeyDown={(event) => handleMessageKeyDown(event, message.id)}
                    className={`relative max-w-[82%] cursor-pointer rounded-[24px] px-4 py-3 shadow-sm outline-none transition focus:ring-2 focus:ring-[#9DB7F2] ${
                      isOwn
                        ? 'bg-[#2F66C8] text-white'
                        : 'border border-[#E3EAF3] bg-white text-[#142952]'
                    }`}
                  >
                    {isActive ? (
                      <div
                        className={`absolute -top-12 z-10 flex items-center gap-1 rounded-full border border-[#E3EAF3] bg-white p-1.5 shadow-[0_12px_28px_rgba(20,41,82,0.16)] ${
                          isOwn ? 'right-0' : 'left-0'
                        }`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(event) =>
                            handleReactionClick(event, message.id, 'like')
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#6E7F9D] transition hover:bg-[#EEF4FF] hover:text-[#2F66C8]"
                          aria-label={t('reactions.like')}
                        >
                          <ThumbsUp size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) =>
                            handleReactionClick(event, message.id, 'laugh')
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#6E7F9D] transition hover:bg-[#FFF4D6] hover:text-[#9A6700]"
                          aria-label={t('reactions.laugh')}
                        >
                          <Smile size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) =>
                            handleReactionClick(event, message.id, 'done')
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#6E7F9D] transition hover:bg-[#EAF8EF] hover:text-[#177B52]"
                          aria-label={t('reactions.done')}
                        >
                          <CheckCircle2 size={17} />
                        </button>

                        {canCreateTaskFromMessage ? (
                          <button
                            type="button"
                            onClick={(event) =>
                              handleSaveAsTaskClick(event, message)
                            }
                            disabled={isSavingThisMessage}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2F66C8] transition hover:bg-[#DCE8FF] disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label={t('saveAsTask')}
                          >
                            {isSavingThisMessage ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <ClipboardPlus size={17} />
                            )}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {!isOwn ? (
                      <p className="text-xs font-semibold text-[#6E7F9D]">
                        {message.sender_name || t('defaultUser')}
                      </p>
                    ) : null}

                    {message.priority === 'urgent' ||
                    message.priority === 'important' ||
                    message.related_apartment ? (
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {message.priority === 'urgent' ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              isOwn
                                ? 'bg-white/18 text-white'
                                : 'bg-[#FFE5E5] text-[#C53030]'
                            }`}
                          >
                            <AlertCircle size={12} />
                            {t('urgent')}
                          </span>
                        ) : null}

                        {message.priority === 'important' ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              isOwn
                                ? 'bg-white/18 text-white'
                                : 'bg-[#FFF4D6] text-[#9A6700]'
                            }`}
                          >
                            <Star size={12} />
                            {t('important')}
                          </span>
                        ) : null}

                        {message.related_apartment ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              isOwn
                                ? 'bg-white/18 text-white'
                                : 'bg-[#EEF4FF] text-[#2F66C8]'
                            }`}
                          >
                            {message.related_apartment}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                      {message.body}
                    </p>

                    {selectedReaction ? (
                      <span
                        className={`mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-sm ${
                          isOwn
                            ? 'border-white/20 bg-white/18 text-white'
                            : 'border-[#E3EAF3] bg-[#F8FAFE] text-[#2F66C8]'
                        }`}
                        aria-label={t('selectedReaction')}
                      >
                        {selectedReaction === 'like' ? <ThumbsUp size={14} /> : null}
                        {selectedReaction === 'laugh' ? <Smile size={14} /> : null}
                        {selectedReaction === 'done' ? <CheckCircle2 size={14} /> : null}
                      </span>
                    ) : null}

                    <p
                      className={`mt-2 text-right text-[11px] ${
                        isOwn ? 'text-white/80' : 'text-[#8C9AB3]'
                      }`}
                    >
                      {formatter.format(new Date(message.created_at))}
                    </p>
                  </div>
                </div>
              )
            })}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[#EEF3F8] bg-white px-4 py-4">
          {error ? (
            <p className="mb-3 rounded-2xl bg-[#FFF4F4] px-4 py-3 text-sm font-medium text-[#C53030]">
              {error}
            </p>
          ) : null}

          <div className="flex items-end gap-3">
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={t('placeholder')}
              rows={3}
              className="min-h-[92px] flex-1 rounded-[24px] border border-[#D9E0EA] bg-[#FBFCFE] px-4 py-3 text-sm text-[#142952] outline-none transition focus:border-[#2F66C8]"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2F66C8] text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t('send')}
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
