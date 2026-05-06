import { supabase } from '@/lib/supabase'
import type { ExistingInventoryPhoto } from '@/lib/inventory/inventoryTypes'
import type { SelectedInventoryPhoto } from '@/hooks/useInventoryPhotos'

export async function uploadPhotosForInventoryItem(params: {
  itemId: string
  profileId: string
  photos: SelectedInventoryPhoto[]
}) {
  const { itemId, profileId, photos } = params

  if (!photos.length) return

  for (const photo of photos) {
    const extension = photo.file.name.split('.').pop() || 'jpg'
    const fileName = `${itemId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('inventory-photos')
      .upload(fileName, photo.file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('inventory-photos')
      .getPublicUrl(fileName)

    const { error: insertPhotoError } = await supabase
      .from('inventory_item_photos')
      .insert({
        item_id: itemId,
        image_url: publicUrlData.publicUrl,
        uploaded_by: profileId,
      })

    if (insertPhotoError) {
      throw insertPhotoError
    }
  }
}

export async function deleteRemovedInventoryPhotos(params: {
  removedPhotoIds: string[]
  itemPhotos?: ExistingInventoryPhoto[]
}) {
  const { removedPhotoIds, itemPhotos = [] } = params

  if (!removedPhotoIds.length) return

  const photosToDelete = itemPhotos.filter(
    (photo) => photo.id && removedPhotoIds.includes(photo.id)
  )

  if (!photosToDelete.length) return

  for (const photo of photosToDelete) {
    try {
      const marker = '/storage/v1/object/public/inventory-photos/'
      const index = photo.image_url.indexOf(marker)

      if (index !== -1) {
        const storagePath = photo.image_url.slice(index + marker.length)
        await supabase.storage.from('inventory-photos').remove([storagePath])
      }
    } catch {
      // continuar aunque falle el borrado del archivo
    }
  }

  const { error } = await supabase
    .from('inventory_item_photos')
    .delete()
    .in('id', removedPhotoIds)

  if (error) {
    throw error
  }
}
