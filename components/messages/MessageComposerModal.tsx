'use client'

import { Loader2, Send, X } from 'lucide-react'

type MessageComposerModalProps = {
  open: boolean
  title: string
  subtitle?: string
  value: string
  sending?: boolean
  error?: string
  t: (key: string) => string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function MessageComposerModal({
  open,
  title,
  subtitle,
  value,
  sending = false,
  error = '',
  t,
  onChange,
  onClose,
  onSubmit,
}: MessageComposerModalProps) {
  const trimmedValue = value.trim()
  const canSubmit = trimmedValue.length > 0 && !sending

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="w-full max-w-md rounded-[30px] bg-white p-5 shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-[#142952]">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-[#6E7F9D]">{subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] p-2 text-[#6E7F9D] transition hover:bg-[#EAF0F8]"
            aria-label={t('messageComposer.close')}
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('messageComposer.placeholder')}
          rows={5}
          className="mt-5 w-full rounded-[24px] border border-[#D9E0EA] bg-[#FBFCFE] px-4 py-4 text-sm text-[#142952] outline-none transition focus:border-[#2F66C8]"
        />

        <p className="mt-2 text-xs text-[#8C9AB3]">
          {t('messageComposer.enterHint')}
        </p>

        {error ? (
          <p className="mt-3 rounded-2xl bg-[#FFF4F4] px-4 py-3 text-sm font-medium text-[#C53030]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[#D9E0EA] px-4 py-3 text-sm font-semibold text-[#6E7F9D] transition hover:bg-[#F8FAFD]"
          >
            {t('messageComposer.cancel')}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2F66C8] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('messageComposer.sending')}
              </>
            ) : (
              <>
                <Send size={16} />
                {t('messageComposer.send')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}