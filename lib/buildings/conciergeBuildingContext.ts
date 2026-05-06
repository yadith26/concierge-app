import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  fetchBuildingsForUser,
  type BuildingSummary,
} from '@/lib/buildings/buildingMembershipService'
import { supabase } from '@/lib/supabase'

export type ConciergeBuildingContext = {
  profileId: string
  buildings: BuildingSummary[]
  building: BuildingSummary | null
  preferredBuildingWasInvalid: boolean
}

export async function resolveConciergeBuildingContext(
  preferredBuildingId?: string | null
): Promise<ConciergeBuildingContext> {
  const {
    data: { user },
    error: userError,
  } = await getSafeAuthUser()

  if (userError || !user) {
    throw new Error(userError?.message || 'Missing authenticated user')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'Missing profile')
  }

  const buildings = await fetchBuildingsForUser({
    userId: profile.id,
    role: 'concierge',
  })

  const preferredBuilding = preferredBuildingId
    ? buildings.find((item) => item.id === preferredBuildingId) || null
    : null

  return {
    profileId: profile.id,
    buildings,
    building: preferredBuilding || buildings[0] || null,
    preferredBuildingWasInvalid: Boolean(preferredBuildingId && !preferredBuilding),
  }
}
