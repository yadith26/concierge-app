'use client'

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from 'react'
import { useTranslations } from 'next-intl'
import { revokePhotoPreviews } from '@/lib/tasks/taskPhotoActions'
import type { ExistingTaskPhoto } from '@/lib/tasks/taskTypes'

export type SelectedPhoto = {
  file: File
  preview: string
}

type UseTaskPhotosParams = {
  initialExistingPhotos?: ExistingTaskPhoto[]
}

type UseTaskPhotosReturn = {
  photos: SelectedPhoto[]
  existingPhotos: ExistingTaskPhoto[]
  removedPhotoIds: string[]
  hydrateExistingPhotos: (items: ExistingTaskPhoto[]) => void
  clearNewPhotos: () => void
  resetAllPhotos: () => void
  handlePhotosSelected: (
    e: ChangeEvent<HTMLInputElement>
  ) => { ok: boolean; message?: string }
  removeNewPhoto: (index: number) => void
  removeExistingPhoto: (photo: ExistingTaskPhoto) => void
}

export function useTaskPhotos({
  initialExistingPhotos = [],
}: UseTaskPhotosParams = {}): UseTaskPhotosReturn {
  const t = useTranslations('taskPhotosValidation')
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [existingPhotos, setExistingPhotos] =
    useState<ExistingTaskPhoto[]>(initialExistingPhotos)
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([])

  const clearNewPhotos = useCallback(() => {
    setPhotos((prev) => {
      revokePhotoPreviews(prev)
      return []
    })
  }, [])

  const hydrateExistingPhotos = useCallback((items: ExistingTaskPhoto[]) => {
    setExistingPhotos(items || [])
    setRemovedPhotoIds([])
  }, [])

  const resetAllPhotos = useCallback(() => {
    setPhotos((prev) => {
      revokePhotoPreviews(prev)
      return []
    })
    setExistingPhotos([])
    setRemovedPhotoIds([])
  }, [])

  const handlePhotosSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])

      if (!files.length) {
        return { ok: false }
      }

      const imageFiles = files.filter((file) => file.type.startsWith('image/'))

      if (!imageFiles.length) {
        e.target.value = ''
        return {
          ok: false,
          message: t('onlyImagesAllowed'),
        }
      }

      const newPhotos: SelectedPhoto[] = imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

      setPhotos((prev) => [...prev, ...newPhotos])
      e.target.value = ''

      return { ok: true }
    },
    [t]
  )

  const removeNewPhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const selected = prev[index]

      if (selected) {
        URL.revokeObjectURL(selected.preview)
      }

      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const removeExistingPhoto = useCallback((photo: ExistingTaskPhoto) => {
    setExistingPhotos((prev) =>
      prev.filter((item) => item.image_url !== photo.image_url)
    )

    const photoId = photo.id

    if (typeof photoId === 'string' && photoId.trim().length > 0) {
      setRemovedPhotoIds((prev) => [...prev, photoId])
    }
  }, [])

  useEffect(() => {
    return () => {
      revokePhotoPreviews(photos)
    }
  }, [photos])

  return {
    photos,
    existingPhotos,
    removedPhotoIds,
    hydrateExistingPhotos,
    clearNewPhotos,
    resetAllPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
  }
}
