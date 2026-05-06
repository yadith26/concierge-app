'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'

export function useSyncConciergeBuildingUrl({
  buildingId,
  path,
  selectedBuildingId,
}: {
  buildingId: string
  path: string
  selectedBuildingId?: string | null
}) {
  const router = useRouter()

  useEffect(() => {
    if (!selectedBuildingId || !buildingId || selectedBuildingId === buildingId) {
      return
    }

    router.replace(`${path}?buildingId=${buildingId}`)
  }, [buildingId, path, router, selectedBuildingId])
}
