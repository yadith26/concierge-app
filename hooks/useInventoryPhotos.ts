'use client'

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from 'react'
import type { ExistingInventoryPhoto } from '@/lib/inventory/inventoryTypes'
import { revokePhotoPreviews } from '@/lib/tasks/taskPhotoActions'

export type SelectedInventoryPhoto = {
  file: File
  preview: string
}

type UseInventoryPhotosReturn = {
  photos: SelectedInventoryPhoto[]
  existingPhotos: ExistingInventoryPhoto[]
  removedPhotoIds: string[]
  hydrateExistingPhotos: (items: ExistingInventoryPhoto[]) => void
  resetAllPhotos: () => void
  handlePhotosSelected: (
    e: ChangeEvent<HTMLInputElement>
  ) => { ok: boolean; message?: string }
  removeNewPhoto: (index: number) => void
  removeExistingPhoto: (photo: ExistingInventoryPhoto) => void
}

export function useInventoryPhotos(): UseInventoryPhotosReturn {
  const [photos, setPhotos] = useState<SelectedInventoryPhoto[]>([])
  const [existingPhotos, setExistingPhotos] = useState<ExistingInventoryPhoto[]>([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([])

  const hydrateExistingPhotos = useCallback((items: ExistingInventoryPhoto[]) => {
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
          message: 'Solo se permiten imagenes.',
        }
      }

      const newPhotos: SelectedInventoryPhoto[] = imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

      setPhotos((prev) => [...prev, ...newPhotos])
      e.target.value = ''

      return { ok: true }
    },
    []
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

  const removeExistingPhoto = useCallback((photo: ExistingInventoryPhoto) => {
    setExistingPhotos((prev) =>
      prev.filter((item) => item.image_url !== photo.image_url)
    )

    if (typeof photo.id === 'string' && photo.id.trim()) {
      setRemovedPhotoIds((prev) => [...prev, photo.id!])
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
    resetAllPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
  }
}
