'use client'

import { useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import TaskSmartParsingHints from '@/components/tasks/TaskSmartParsingHints'
import type { TaskCategory } from '@/lib/tasks/taskTypes'

type SmartParsedInput = {
  detectedCategory?: TaskCategory | null
  detectedPriority?: 'high' | 'medium' | 'low' | null
  detectedDate?: string | null
  detectedTime?: string | null
  detectedLocation?: string | null
  cleanedTitle?: string | null
  shouldAutoSubmit?: boolean
}

type TaskTitleFieldProps = {
  title: string
  category: TaskCategory | ''
  placeholder?: string
  smartParsed: SmartParsedInput
  onTitleChange: (value: string) => void
  onTryApplySmartParsing: (value: string) => SmartParsedInput
  onUseCleanTitle: (value: string) => void
  onQuickSubmit: () => Promise<void>
}

declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
  }
}

export default function TaskTitleField({
  title,
  category,
  placeholder,
  smartParsed,
  onTitleChange,
  onTryApplySmartParsing,
  onUseCleanTitle,
  onQuickSubmit,
}: TaskTitleFieldProps) {
  const t = useTranslations('taskTitleField')
  const locale = useLocale()
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const getSpeechLang = () => {
    if (locale.startsWith('en')) return 'en-US'
    if (locale.startsWith('fr')) return 'fr-CA'
    if (locale.startsWith('ru')) return 'ru-RU'
    return 'es-ES'
  }

  const handleTitleValue = (value: string) => {
    onTitleChange(value)
    onTryApplySmartParsing(value)
  }

  const handleToggleDictation = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta dictado.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = getSpeechLang()
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onresult = (event: any) => {
      let transcript = ''

      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }

      const value = transcript.trim()
      handleTitleValue(value)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {t('label')}
      </label>

      <div className="flex items-center gap-2 rounded-2xl border border-[#E7EDF5] bg-white px-3 py-2 transition focus-within:border-[#BCD1F3] focus-within:ring-2 focus-within:ring-[#EAF2FF]">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            handleTitleValue(e.target.value)
          }}
          onKeyDown={async (e) => {
            if (e.key !== 'Enter' || e.shiftKey) return

            const parsed = onTryApplySmartParsing(title)

            if (!parsed.shouldAutoSubmit) return

            e.preventDefault()
            await onQuickSubmit()
          }}
          placeholder={isListening ? 'Escuchando...' : placeholder || t('placeholder')}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-[#142952] outline-none placeholder:text-[#8C9AB3]"
        />

        <button
          type="button"
          onClick={handleToggleDictation}
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
            isListening
              ? 'bg-[#E85757] text-white shadow-[0_8px_20px_rgba(232,87,87,0.28)]'
              : 'bg-[#EEF4FF] text-[#4D66DA]'
          }`}
          aria-label={isListening ? 'Detener dictado' : 'Dictar título'}
        >
          {isListening ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E85757] opacity-40" />
          ) : null}
          <Mic size={19} className="relative" />
        </button>
      </div>

      {isListening ? (
        <p className="mt-2 text-[12px] font-medium text-[#E85757]">
          Escuchando... toca el micrófono para detener.
        </p>
      ) : null}

      <TaskSmartParsingHints
        title={title}
        category={category}
        smartParsed={smartParsed}
        onUseCleanTitle={onUseCleanTitle}
      />
    </div>
  )
}
