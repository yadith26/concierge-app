'use client'

import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ExistingPhoto = {
  id?: string
  image_url: string
}

type SelectedPhotoLike = {
  file: File
  preview: string
}

type TaskPhotosSectionProps = {
  existingPhotos: ExistingPhoto[]
  photos: SelectedPhotoLike[]
  onSelectPhotos: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => { ok: boolean; message?: string }
  onRemoveExistingPhoto: (photo: ExistingPhoto) => void
  onRemoveNewPhoto: (index: number) => void
  onMessage: (message: string) => void
}

export default function TaskPhotosSection({
  existingPhotos,
  photos,
  onSelectPhotos,
  onRemoveExistingPhoto,
  onRemoveNewPhoto,
  onMessage,
}: TaskPhotosSectionProps) {
  const t = useTranslations('taskPhotosSection')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = onSelectPhotos(e)

    if (!result.ok && result.message) {
      onMessage(result.message)
      return
    }

    onMessage('')
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {t('label')}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-4 text-sm font-semibold text-[#2F66C8] transition hover:bg-[#F3F7FD]">
          <Camera className="h-4 w-4" />
          {t('takePhoto')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-4 text-sm font-semibold text-[#142952] transition hover:bg-[#F8FAFE]">
          <ImageIcon className="h-4 w-4" />
          {t('uploadPhotos')}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>

      {existingPhotos.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-[#5E6E8C]">
            {t('currentPhotos')}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {existingPhotos.map((photo, index) => (
              <div
                key={photo.id || `${photo.image_url}-${index}`}
                className="relative overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white"
              >
                <img
                  src={photo.image_url}
                  alt={t('currentPhotoAlt', { index: index + 1 })}
                  className="h-24 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveExistingPhoto(photo)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#D64555] shadow-sm"
                  aria-label={t('removeCurrentPhoto')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-[#5E6E8C]">
            {t('newPhotos')}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={`${photo.file.name}-${index}`}
                className="relative overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white"
              >
                <img
                  src={photo.preview}
                  alt={t('newPhotoAlt', { index: index + 1 })}
                  className="h-24 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveNewPhoto(index)}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-[#D64555] shadow-sm"
                  aria-label={t('removeNewPhoto')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
