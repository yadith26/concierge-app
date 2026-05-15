'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { useTranslations } from 'next-intl'

import { normalizeApartmentKey } from '@/lib/locations/normalizeApartment'
import { parseSmartTaskInput } from '@/lib/tasks/taskSmartParser'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

type UseDashboardCreateActionsParams = {
  locale: string
  openCreateModal: () => void
}

type DictationErrorType =
  | 'unsupported'
  | 'permission'
  | 'recording'
  | 'transcription'
  | 'empty'
  | 'generic'

type DictationStartResponse = {
  mimeType: string
  recorder: MediaRecorder
  stream: MediaStream
}

type SpeechRecognitionEventLike = {
  error?: string
  results?: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal?: boolean }>
}

type SpeechRecognitionLike = {
  lang: string
  continuous?: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: unknown) => void) | null
  onerror: ((event?: unknown) => void) | null
  onend: ((event?: unknown) => void) | null
  start: () => void
  stop: () => void
}

const MAX_RECORDING_MS = 45000

export function useDashboardCreateActions({
  locale,
  openCreateModal,
}: UseDashboardCreateActionsParams) {
  const t = useTranslations('dashboardDictation')
  const [requestTaskDraft, setRequestTaskDraft] = useState<TaskDraft | null>(null)
  const [requestSourceId, setRequestSourceId] = useState<string | null>(null)
  const [quickPhotoFile, setQuickPhotoFile] = useState<File | null>(null)
  const [dictationError, setDictationError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const quickPhotoInputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const speechResolvedRef = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const mimeTypeRef = useRef('audio/webm')
  const stopTimeoutRef = useRef<number | null>(null)

  const stopMediaTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearStopTimeout()
      speechResolvedRef.current = true
      recognitionRef.current?.stop()
      recorderRef.current?.stop()
      stopMediaTracks()
    }
  }, [clearStopTimeout, stopMediaTracks])

  const getSpeechLang = useCallback(() => {
    if (locale.startsWith('en')) return 'en-US'
    if (locale.startsWith('fr')) return 'fr-CA'
    if (locale.startsWith('ru')) return 'ru-RU'
    return 'es-ES'
  }, [locale])

  const getDictationMessage = useCallback(
    (type: DictationErrorType) => {
      if (type === 'unsupported') return t('errors.unsupported')
      if (type === 'permission') return t('errors.permission')
      if (type === 'recording') return t('errors.recording')
      if (type === 'transcription') return t('errors.transcription')
      if (type === 'empty') return t('errors.empty')
      return t('errors.generic')
    },
    [t]
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
      const parsed = parseSmartTaskInput(transcript, locale)
      const detectedVisitType = parsed.detectedVisitType || 'nuevo'
      const detectedAreas = Array.isArray(parsed.detectedAreas)
        ? parsed.detectedAreas
        : []
      const detectedSelections = [...parsed.detectedApartments, ...detectedAreas].map((entry) => ({
        apartment_or_area: entry,
        apartment_key: normalizeApartmentKey(entry),
        visit_type: detectedVisitType,
      }))

      setRequestTaskDraft({
        title: parsed.cleanedTitle || transcript,
        description: '',
        apartment_or_area: parsed.detectedLocation || detectedSelections[0]?.apartment_or_area || '',
        apartment_key: detectedSelections[0]?.apartment_key || null,
        category: parsed.detectedCategory || 'other',
        priority: parsed.detectedPriority || 'medium',
        task_date: parsed.detectedDate || new Date().toLocaleDateString('en-CA'),
        task_time: parsed.detectedTime || '',
        pest_targets: parsed.detectedPestTargets,
        treatment_visit_type: parsed.detectedVisitType,
        task_apartments: detectedSelections,
      })

      openCreateModal()
    },
    [locale, openCreateModal]
  )

  const startBrowserSpeechRecognition = useCallback(() => {
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => unknown
      webkitSpeechRecognition?: new () => unknown
    }

    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition

    if (!SpeechRecognition) {
      return false
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionLike
    recognitionRef.current = recognition
    speechResolvedRef.current = false

    recognition.lang = getSpeechLang()
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    setDictationError(null)
    setIsListening(true)

    recognition.onresult = (event: unknown) => {
      const speechEvent = event as SpeechRecognitionEventLike
      if (!speechEvent.results || speechResolvedRef.current) return

      let transcript = ''
      let hasFinalResult = false

      for (let index = 0; index < speechEvent.results.length; index += 1) {
        hasFinalResult =
          hasFinalResult || Boolean(speechEvent.results[index]?.isFinal)
        transcript += speechEvent.results[index]?.[0]?.transcript || ''
      }

      const value = transcript.trim()
      if (!value || !hasFinalResult) return

      speechResolvedRef.current = true
      recognitionRef.current = null
      setIsListening(false)
      recognition.stop()
      openDraftFromTranscript(value)
    }

    recognition.onerror = (event: unknown) => {
      const speechEvent = event as SpeechRecognitionEventLike
      speechResolvedRef.current = true
      recognitionRef.current = null
      setIsListening(false)

      if (
        speechEvent.error === 'not-allowed' ||
        speechEvent.error === 'service-not-allowed'
      ) {
        setDictationError(getDictationMessage('permission'))
      }
    }

    recognition.onend = () => {
      speechResolvedRef.current = true
      recognitionRef.current = null
      setIsListening(false)
    }

    try {
      recognition.start()
      return true
    } catch {
      recognitionRef.current = null
      setIsListening(false)
      return false
    }
  }, [getDictationMessage, getSpeechLang, openDraftFromTranscript])

  const chooseRecordingMimeType = useCallback(() => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
    ]

    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return ''
    }

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
  }, [])

  const startRecorder = useCallback(async (): Promise<DictationStartResponse> => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      throw new Error('unsupported')
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = chooseRecordingMimeType()
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream)

    return {
      mimeType: mimeType || recorder.mimeType || 'audio/webm',
      recorder,
      stream,
    }
  }, [chooseRecordingMimeType])

  const transcribeRecordedAudio = useCallback(
    async (blob: Blob, mimeType: string) => {
      const extension = mimeType.includes('mp4')
        ? 'm4a'
        : mimeType.includes('mpeg')
          ? 'mp3'
          : 'webm'

      const file = new File([blob], `dictation.${extension}`, {
        type: mimeType || blob.type || 'audio/webm',
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('locale', locale)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json().catch(() => null)) as
        | { text?: string; error?: string }
        | null

      if (!response.ok) {
        throw new Error(data?.error || 'transcription_failed')
      }

      const transcript = data?.text?.trim()
      if (!transcript) {
        throw new Error('empty_transcript')
      }

      return transcript
    },
    [locale]
  )

  const stopActiveRecording = useCallback(() => {
    clearStopTimeout()

    if (!recorderRef.current || recorderRef.current.state === 'inactive') {
      setIsListening(false)
      stopMediaTracks()
      return
    }

    recorderRef.current.stop()
    setIsListening(false)
    setIsTranscribing(true)
  }, [clearStopTimeout, stopMediaTracks])

  const openDictateTask = useCallback(async () => {
    if (isTranscribing) {
      return
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        return
      }

      stopActiveRecording()
      return
    }

    setDictationError(null)
    chunksRef.current = []

    if (startBrowserSpeechRecognition()) {
      return
    }

    try {
      const { mimeType, recorder, stream } = await startRecorder()

      recorderRef.current = recorder
      streamRef.current = stream
      mimeTypeRef.current = mimeType

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        clearStopTimeout()
        recorderRef.current = null
        setIsListening(false)
        setIsTranscribing(false)
        stopMediaTracks()
        setDictationError(getDictationMessage('recording'))
      }

      recorder.onstop = async () => {
        clearStopTimeout()
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || 'audio/webm',
        })
        chunksRef.current = []
        recorderRef.current = null
        stopMediaTracks()

        if (!blob.size) {
          setIsTranscribing(false)
          setDictationError(getDictationMessage('empty'))
          return
        }

        try {
          const transcript = await transcribeRecordedAudio(
            blob,
            mimeTypeRef.current || blob.type
          )
          setIsTranscribing(false)
          openDraftFromTranscript(transcript)
        } catch (error) {
          setIsTranscribing(false)
          const message =
            error instanceof Error && error.message === 'empty_transcript'
              ? getDictationMessage('empty')
              : getDictationMessage('transcription')
          setDictationError(message)
        }
      }

      recorder.start()
      setIsListening(true)

      stopTimeoutRef.current = window.setTimeout(() => {
        stopActiveRecording()
      }, MAX_RECORDING_MS)
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'unsupported'
          ? getDictationMessage('unsupported')
          : getDictationMessage('permission')
      setDictationError(message)
      stopMediaTracks()
      setIsListening(false)
      setIsTranscribing(false)
    }
  }, [
    clearStopTimeout,
    getDictationMessage,
    isTranscribing,
    isListening,
    openDraftFromTranscript,
    startBrowserSpeechRecognition,
    startRecorder,
    stopActiveRecording,
    stopMediaTracks,
    transcribeRecordedAudio,
  ])

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
    isTranscribing,
    setRequestTaskDraft,
    setRequestSourceId,
    clearDictationError,
    openDictateTask,
    openQuickPhotoCamera,
    handleQuickPhotoSelected,
    resetCreateContext,
  }
}
