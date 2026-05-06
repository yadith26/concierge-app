import { supabase } from '@/lib/supabase'
import type { ExistingTaskPhoto } from '@/lib/tasks/taskTypes'

type SelectedPhoto = {
  file: File
  preview: string
}

export async function uploadPhotosForTask(params: {
  taskId: string
  profileId: string
  photos: SelectedPhoto[]
}) {
  const { taskId, profileId, photos } = params

  if (!photos.length) return

  for (const photo of photos) {
    const extension = photo.file.name.split('.').pop() || 'jpg'
    const fileName = `${taskId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('task-photos')
      .upload(fileName, photo.file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('task-photos')
      .getPublicUrl(fileName)

    const imageUrl = publicUrlData.publicUrl

    const { error: insertPhotoError } = await supabase
      .from('task_photos')
      .insert({
        task_id: taskId,
        image_url: imageUrl,
        uploaded_by: profileId,
      })

    if (insertPhotoError) {
      throw insertPhotoError
    }
  }
}

export async function deleteRemovedPhotos(params: {
  removedPhotoIds: string[]
  taskPhotos?: ExistingTaskPhoto[]
}) {
  const { removedPhotoIds, taskPhotos = [] } = params

  if (!removedPhotoIds.length) return

  const photosToDelete = taskPhotos.filter(
    (photo) => photo.id && removedPhotoIds.includes(photo.id)
  )

  if (!photosToDelete.length) return

  for (const photo of photosToDelete) {
    try {
      const marker = '/storage/v1/object/public/task-photos/'
      const index = photo.image_url.indexOf(marker)

      if (index !== -1) {
        const storagePath = photo.image_url.slice(index + marker.length)
        await supabase.storage.from('task-photos').remove([storagePath])
      }
    } catch {
      // continuar aunque falle el borrado del archivo
    }
  }

  const { error } = await supabase
    .from('task_photos')
    .delete()
    .in('id', removedPhotoIds)

  if (error) {
    throw error
  }
}

export function revokePhotoPreviews(photos: SelectedPhoto[]) {
  photos.forEach((photo) => URL.revokeObjectURL(photo.preview))
}