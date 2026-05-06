'use client'

import { useTranslations } from 'next-intl'
import { Building2, Plus } from 'lucide-react'

type InventoryHeaderActionsProps = {
  buildingName: string
  onOpenCreate: () => void
  showBuilding?: boolean
}

export default function InventoryHeaderActions({
  buildingName,
  onOpenCreate,
  showBuilding = true,
}: InventoryHeaderActionsProps) {
  const t = useTranslations('inventoryHeaderActions')

  return (
    <>
      {showBuilding ? (
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm">
          <div className="rounded-full bg-[#F3F6FB] p-1.5 text-[#8C9AB3]">
            <Building2 size={15} />
          </div>

          <span className="text-[15px] text-[#6E7F9D]">{t('building')}</span>

          <span className="max-w-[190px] truncate text-[15px] font-semibold text-[#142952]">
            {buildingName || t('noBuilding')}
          </span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onOpenCreate}
        className={`flex w-full items-center justify-center gap-3 rounded-[28px] bg-[#3E63E6] px-5 py-3.5 text-[17px] font-semibold text-white shadow-[0_16px_30px_rgba(62,99,230,0.28)] hover:bg-[#3558D8] ${
          showBuilding ? 'mt-4' : ''
        }`}
      >
        <Plus size={24} />
        {t('newItem')}
      </button>
    </>
  )
}
