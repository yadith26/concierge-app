import { supabase } from '@/lib/supabase'
import {
  OWNER_REQUEST_SELECT_FIELDS,
  type OwnerRequestItem,
} from '@/lib/owner-requests/ownerRequestHelpers'

export async function loadOwnerRequests(buildingId: string) {
  const { data, error } = await supabase
    .from('owner_requests')
    .select(OWNER_REQUEST_SELECT_FIELDS)
    .eq('building_id', buildingId)
    .in('status', ['pending', 'viewed'])
    .order('suggested_date', { ascending: true })
    .order('created_at', { ascending: false })

  return {
    data: (data as OwnerRequestItem[]) || [],
    error,
  }
}

export async function updateOwnerRequestStatus(
  requestIds: string[] | string,
  status: OwnerRequestItem['status']
) {
  const query = supabase
    .from('owner_requests')
    .update({ status, updated_at: new Date().toISOString() })

  if (Array.isArray(requestIds)) {
    return query.in('id', requestIds)
  }

  return query.eq('id', requestIds)
}
