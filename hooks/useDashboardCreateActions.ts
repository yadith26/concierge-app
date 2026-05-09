'use client'

import { useCallback, useRef, useState, type ChangeEvent } from 'react'

import type { TaskDraft } from '@/lib/tasks/taskTypes'

type UseDashboardCreateActionsParams = {
  locale: string
  openCreateModal: () => void
}

type SpeechRecognitionResultLike = {
  transcript?: string
}

type SpeechRecognitionAlternativeListLike =
  ArrayLike<SpeechRecognitionResultLike>

type SpeechRecognitionResultLikeWithFinal = SpeechRecognitionAlternativeListLike & {
  isFinal?: boolean
}

type SpeechRecognitionResultListLike =
  ArrayLike<SpeechRecognitionResultLikeWithFinal>

type SpeechRecognitionError =
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed'
  | string

type SpeechRecognitionEventLike = Event & {
  error?: SpeechRecognitionError
  results?: SpeechRecognitionResultListLike
}

type SpeechRecognitionLike = {
  lang: string
  continuous?: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

export function useDashboardCreateActions({
  locale,
  openCreateModal,
}: UseDashboardCreateActionsParams) {
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)
  const [quickPhotoFile, setQuickPhotoFile] = useState<File | null>(null)
  const [dictationError, setDictationError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')
  const shouldCreateDraftRef = useRef(false)

  const getSpeechLang = useCallback(() => {
    if (locale.startsWith('en')) return 'en-US'
    if (locale.startsWith('fr')) return 'fr-CA'
    if (locale.startsWith('ru')) return 'ru-RU'
    return 'es-ES'
  }, [locale])

  const getDictationMessage = useCallback(
    (
      type: 'unsupported' | 'permission' | 'noSpeech' | 'noMicrophone' | 'generic'
    ) => {
      const isEnglish = locale.startsWith('en')
      const isFrench = locale.startsWith('fr')
      const isRussian = locale.startsWith('ru')

      if (isEnglish) {
        if (type === 'unsupported') {
          return 'Voice dictation is not available in this browser. Try Chrome or Safari.'
        }
        if (type === 'permission') {
          return 'We could not access the microphone. Allow microphone permission and try again.'
        }
        if (type === 'noSpeech') {
          return 'We did not detect any voice. Try again and speak closer to the microphone.'
        }
        if (type === 'noMicrophone') {
          return 'No microphone was detected on this device.'
        }
        return 'We could not start voice dictation right now.'
      }

      if (isFrench) {
        if (type === 'unsupported') {
          return 'La dictee vocale n est pas disponible dans ce navigateur. Essaie Chrome ou Safari.'
        }
        if (type === 'permission') {
          return 'Impossible d acceder au microphone. Autorise le micro puis reessaie.'
        }
        if (type === 'noSpeech') {
          return 'Aucune voix detectee. Reessaie en parlant plus pres du microphone.'
        }
        if (type === 'noMicrophone') {
          return 'Aucun microphone n a ete detecte sur cet appareil.'
        }
        return 'La dictee vocale n a pas pu demarrer pour le moment.'
      }

      if (isRussian) {
        if (type === 'unsupported') {
          return 'Golosovoi vvod nedostupen v etom brauzere. Poprobui Chrome ili Safari.'
        }
        if (type === 'permission') {
          return 'Ne udalos poluchit dostup k mikrofonu. Razreshi dostup i poprobui snova.'
        }
        if (type === 'noSpeech') {
          return 'Goloso ne raspoznan. Poprobui eshche raz i govori blizhe k mikrofonu.'
        }
        if (type === 'noMicrophone') {
          return 'Na etom ustroistve ne naiden mikrofon.'
        }
        return 'Ne udalos zapustit golosovoi vvod.'
      }

      if (type === 'unsupported') {
        return 'Tu navegador no soporta dictado. Prueba en Chrome o Safari.'
      }
      if (type === 'permission') {
        return 'No pudimos usar el microfono. Activa el permiso del microfono y vuelve a intentarlo.'
      }
      if (type === 'noSpeech') {
        return 'No detectamos tu voz. Intentalo otra vez hablando mas cerca del microfono.'
      }
      if (type === 'noMicrophone') {
        return 'No encontramos un microfono disponible en este dispositivo.'
      }
      return 'No se pudo iniciar el dictado en este momento.'
    },
    [locale]
  )

  const resetCreateContext = useCallback(() => {
    setRequestTaskDraft(null)
    setRequestSourceId(null)
    setQuickPhotoFile(null)
  }, [])

  const clearDictationError = useCallback(() => {
    setDictationError(null)
  }, [])

  const openDraftFromTranscript = useCallback(
    (transcript: string) => {
      setRequestTaskDraft({
        title: transcript,
        description: '',
        apartment_or_area: '',
        category: 'other',
        priority: 'medium',
        task_date: new Date().toLocaleDateString('en-CA'),
        task_time: '',
      })

      openCreateModal()
    },
    [openCreateModal]
  )

  const openDictateTask = useCallback(() => {
    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }

    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setDictationError(getDictationMessage('unsupported'))
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    transcriptRef.current = ''
    shouldCreateDraftRef.current = true

    recognition.lang = getSpeechLang()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    setDictationError(null)
    setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      if (!event.results) return

      let transcript = ''
      let hasFinalResult = false

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        transcript += result?.[0]?.transcript || ''
        if (result?.isFinal) {
          hasFinalResult = true
        }
      }

      transcriptRef.current = transcript.trim()

      if (hasFinalResult) {
        recognition.stop()
      }
    }

    recognition.onerror = (event: SpeechRecognitionEventLike) => {
      shouldCreateDraftRef.current = false
      setIsListening(false)

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setDictationError(getDictationMessage('permission'))
        return
      }

      if (event.error === 'no-speech') {
        setDictationError(getDictationMessage('noSpeech'))
        return
      }

      if (event.error === 'audio-capture') {
        setDictationError(getDictationMessage('noMicrophone'))
        return
      }

      if (event.error !== 'aborted') {
        setDictationError(getDictationMessage('generic'))
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null

      const transcript = transcriptRef.current.trim()
      transcriptRef.current = ''

      if (!shouldCreateDraftRef.current || !transcript) {
        return
      }

      openDraftFromTranscript(transcript)
    }

    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      shouldCreateDraftRef.current = false
      setIsListening(false)
      setDictationError(getDictationMessage('generic'))
    }
  }, [getDictationMessage, getSpeechLang, isListening, openDraftFromTranscript])

  const openQuickPhotoCamera = useCallback(() => {
    quickPhotoInputRef.current?.click()
  }, [])

  const handleQuickPhotoSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setQuickPhotoFile(file)
      event.target.value = ''
      openCreateModal()
    },
    [openCreateModal]
  )

  return {
    requestTaskDraft,
    requestSourceId,
    quickPhotoFile,
    quickPhotoInputRef,
    dictationError,
    isListening,
    setRequestTaskDraft,
    setRequestSourceId,
    clearDictationError,
    openDictateTask,
    openQuickPhotoCamera,
    handleQuickPhotoSelected,
    resetCreateContext,
  }
}
