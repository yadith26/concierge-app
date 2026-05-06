import { supabase } from '@/lib/supabase'

export async function uploadProfilePhoto({
  file,
  previousPhotoUrl,
  userId,
}: {
  file: File
  previousPhotoUrl?: string | null
  userId: string
}) {
  const extension = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  await removeProfilePhoto(previousPhotoUrl)

  const { data } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(fileName)

  return data.publicUrl
}

export async function removeProfilePhoto(photoUrl?: string | null) {
  if (!photoUrl) return

  try {
    const marker = '/storage/v1/object/public/profile-photos/'
    const index = photoUrl.indexOf(marker)

    if (index !== -1) {
      const storagePath = photoUrl.slice(index + marker.length)
      await supabase.storage.from('profile-photos').remove([storagePath])
    }
  } catch {
    // The profile can still be updated even if deleting the old file fails.
  }
}
