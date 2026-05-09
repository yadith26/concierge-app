'use client'

export function useConciergeDashboardView({
  selectedBuildingId,
  isConciergeHome,
}: {
  selectedBuildingId?: string | null
  isConciergeHome: boolean
}) {
  const normalizedSelectedBuildingId = selectedBuildingId?.trim() || ''
  const isHomeSelection = !normalizedSelectedBuildingId
  const isHomeView = isHomeSelection || isConciergeHome

  return {
    selectedBuildingId: normalizedSelectedBuildingId,
    isHomeSelection,
    isHomeView,
  }
}
