import { supabase } from '@/lib/supabase'

const BUCKET = 'building-photos'
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`

export async function uploadBuildingPhoto({
  buildingId,
  file,
  previousPhotoUrl,
}: {
  buildingId: string
  file: File
  previousPhotoUrl?: string | null
}) {
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${buildingId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    if (uploadError.message?.toLowerCase().includes('bucket not found')) {
      throw new Error(
        'Falta crear el bucket building-photos en Supabase. Corre el SQL de fotos de edificios y vuelve a intentarlo.'
      )
    }

    throw uploadError
  }

  await removeBuildingPhoto(previousPhotoUrl)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)

  return data.publicUrl
}

export async function removeBuildingPhoto(photoUrl?: string | null) {
  if (!photoUrl) return

  try {
    const index = photoUrl.indexOf(PUBLIC_MARKER)

    if (index !== -1) {
      const storagePath = photoUrl.slice(index + PUBLIC_MARKER.length)
      await supabase.storage.from(BUCKET).remove([storagePath])
    }
  } catch {
    // The building can still be updated even if deleting the old file fails.
  }
}
