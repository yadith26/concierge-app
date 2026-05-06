import { supabase } from '@/lib/supabase'

export type BuildingRole = 'manager' | 'concierge'

export type BuildingSummary = {
  id: string
  name: string
  address: string | null
  invite_code: string | null
  building_photo_url: string | null
}

type BuildingSummaryRow = {
  id: string
  name: string
  address: string | null
  invite_code: string | null
  building_photo_url?: string | null
}

type BuildingUserWithBuilding = {
  buildings_new: BuildingSummaryRow | BuildingSummaryRow[] | null
}

const BUILDING_SELECT_FIELDS = 'id, name, address, invite_code'
const BUILDING_SELECT_FIELDS_WITH_PHOTO =
  'id, name, address, invite_code, building_photo_url'

function isMissingBuildingPhotoColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.includes('building_photo_url'))
}

export function generateInviteCode() {
  return `BLDG-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase()
}

function flattenMembershipBuilding(row: BuildingUserWithBuilding) {
  return Array.isArray(row.buildings_new)
    ? row.buildings_new[0]
    : row.buildings_new
}

function normalizeBuildingSummary(building: BuildingSummaryRow): BuildingSummary {
  return {
    id: building.id,
    name: building.name,
    address: building.address ?? null,
    invite_code: building.invite_code ?? null,
    building_photo_url: building.building_photo_url ?? null,
  }
}

export async function fetchBuildingsForUser({
  userId,
  role,
}: {
  userId: string
  role: BuildingRole
}) {
  const withPhotoResponse = await supabase
    .from('building_users')
    .select(`buildings_new(${BUILDING_SELECT_FIELDS_WITH_PHOTO})`)
    .eq('user_id', userId)
    .eq('role', role)

  let data = withPhotoResponse.data as unknown
  let error = withPhotoResponse.error

  if (isMissingBuildingPhotoColumn(error)) {
    const fallbackResponse = await supabase
      .from('building_users')
      .select(`buildings_new(${BUILDING_SELECT_FIELDS})`)
      .eq('user_id', userId)
      .eq('role', role)

    data = fallbackResponse.data as unknown
    error = fallbackResponse.error
  }

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los edificios.')
  }

  return ((data as BuildingUserWithBuilding[]) || [])
    .map(flattenMembershipBuilding)
    .filter((building): building is BuildingSummaryRow => Boolean(building))
    .map(normalizeBuildingSummary)
}

export async function connectBuildingByCode({
  inviteCode,
  role,
  userId,
}: {
  inviteCode: string
  role: BuildingRole
  userId: string
}) {
  const code = normalizeInviteCode(inviteCode)

  if (!code) {
    throw new Error('Escribe el codigo del edificio.')
  }

  const { data: building, error: buildingError } = await supabase
    .from('buildings_new')
    .select(BUILDING_SELECT_FIELDS)
    .eq('invite_code', code)
    .maybeSingle()

  if (buildingError || !building) {
    throw new Error('No encontramos un edificio con ese codigo.')
  }

  await upsertBuildingMembership({
    buildingId: building.id,
    role,
    userId,
  })

  if (role === 'concierge') {
    await supabase
      .from('buildings_new')
      .update({ concierge_id: userId })
      .eq('id', building.id)
      .is('concierge_id', null)
  }

  return normalizeBuildingSummary(building as BuildingSummaryRow)
}

export async function createBuildingForUser({
  address,
  name,
  role,
  userId,
}: {
  address: string
  name: string
  role: BuildingRole
  userId: string
}) {
  const cleanName = name.trim()

  if (!cleanName) {
    throw new Error('Escribe el nombre del edificio.')
  }

  const inviteCode = generateInviteCode()

  const { data, error } = await supabase
    .from('buildings_new')
    .insert({
      concierge_id: role === 'concierge' ? userId : null,
      created_by: userId,
      invite_code: inviteCode,
      name: cleanName,
      address: address.trim() || null,
    })
    .select(BUILDING_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo crear el edificio.')
  }

  await upsertBuildingMembership({
    buildingId: data.id,
    role,
    userId,
  })

  return normalizeBuildingSummary(data as BuildingSummaryRow)
}

export async function updateBuilding({
  address,
  buildingId,
  inviteCode,
  photoUrl,
  name,
  role,
  userId,
}: {
  address: string
  buildingId: string
  inviteCode: string | null
  photoUrl?: string | null
  name: string
  role: BuildingRole
  userId: string
}) {
  const nextInviteCode = inviteCode || generateInviteCode()

  const updatePayload: Record<string, string | null | undefined> = {
    name: name.trim(),
    address: address.trim() || null,
    invite_code: nextInviteCode,
    concierge_id: role === 'concierge' ? userId : undefined,
  }

  if (photoUrl !== undefined) {
    updatePayload.building_photo_url = photoUrl || null
  }

  const { data, error } = await supabase
    .from('buildings_new')
    .update(updatePayload)
    .eq('id', buildingId)
    .select(BUILDING_SELECT_FIELDS)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'No se pudo guardar el edificio.')
  }

  await upsertBuildingMembership({
    buildingId,
    role,
    userId,
  })

  return normalizeBuildingSummary(data as BuildingSummaryRow)
}

export async function unlinkBuildingFromUser({
  buildingId,
  role,
  userId,
}: {
  buildingId: string
  role: BuildingRole
  userId: string
}) {
  const { error } = await supabase
    .from('building_users')
    .delete()
    .eq('building_id', buildingId)
    .eq('user_id', userId)
    .eq('role', role)

  if (error) {
    throw new Error(error.message || 'No se pudo desvincular el edificio.')
  }

  if (role === 'concierge') {
    const { error: buildingError } = await supabase
      .from('buildings_new')
      .update({ concierge_id: null })
      .eq('id', buildingId)
      .eq('concierge_id', userId)

    if (buildingError) {
      throw new Error(
        buildingError.message || 'No se pudo actualizar el edificio.'
      )
    }
  }
}

async function upsertBuildingMembership({
  buildingId,
  role,
  userId,
}: {
  buildingId: string
  role: BuildingRole
  userId: string
}) {
  const { error } = await supabase.from('building_users').upsert(
    {
      building_id: buildingId,
      user_id: userId,
      role,
    },
    {
      onConflict: 'building_id,user_id,role',
      ignoreDuplicates: true,
    }
  )

  if (error) {
    throw new Error(`No se pudo conectar el edificio: ${error.message}`)
  }
}
