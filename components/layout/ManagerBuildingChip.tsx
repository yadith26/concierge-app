'use client'

import { useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown, Grid3X3 } from 'lucide-react'
import { Link } from '@/i18n/navigation'

type ManagerBuildingOption = {
  id: string
  name: string
  address: string | null
}

type ManagerBuildingChipProps = {
  buildingId?: string
  buildingName: string
  buildings?: ManagerBuildingOption[]
  getBuildingHref?: (buildingId: string) => string
  label?: string
  mainHref?: string
  mainLabel?: string
  mainDescription?: string
  size?: 'default' | 'compact'
  singleBuildingMode?: 'link' | 'static'
}

export default function ManagerBuildingChip({
  buildingId,
  buildingName,
  buildings = [],
  getBuildingHref = (nextBuildingId) => `/manager/buildings/${nextBuildingId}`,
  label = 'Cambiar edificio',
  mainHref = '/manager',
  mainLabel = 'Pantalla principal',
  mainDescription = 'Ver, crear o conectar edificios',
  size = 'default',
  singleBuildingMode = 'link',
}: ManagerBuildingChipProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const hasMenu = buildings.length > 1

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  if (!hasMenu && singleBuildingMode === 'static') {
    return (
      <div
        className={`inline-flex max-w-full items-center transition ${
          size === 'compact'
            ? 'gap-2 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm'
            : 'gap-3 rounded-full border border-[#E7EDF5] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(20,41,82,0.08)]'
        }`}
        aria-label={`Edificio actual: ${buildingName}`}
      >
        {size === 'compact' ? (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3F6FB] text-[#8C9AB3]">
              <Building2 size={15} />
            </span>

            <span className="text-[15px] text-[#6E7F9D]">{label}</span>

            <span className="max-w-[190px] truncate text-[15px] font-semibold text-[#142952]">
              {buildingName}
            </span>
          </>
        ) : (
          <>
            <BuildingIcon compact={false} />
            <ChipLabel buildingName={buildingName} label={label} />
          </>
        )}
      </div>
    )
  }

  if (!hasMenu) {
    return (
      <Link
        href={mainHref}
        className={`inline-flex max-w-full items-center transition ${
          size === 'compact'
            ? 'gap-2 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm hover:bg-white'
            : 'gap-3 rounded-full border border-[#E7EDF5] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(20,41,82,0.08)] hover:bg-[#FBFCFE]'
        }`}
        aria-label={`Cambiar edificio desde ${buildingName}`}
      >
        <BuildingIcon compact={size === 'compact'} />
        <ChipLabel buildingName={buildingName} label={label} />
        <ChevronBadge compact={size === 'compact'} />
      </Link>
    )
  }

  return (
    <div ref={menuRef} className="relative inline-block min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex max-w-full items-center text-left transition ${
          size === 'compact'
            ? 'gap-2 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm hover:bg-white'
            : 'gap-3 rounded-full border border-[#E7EDF5] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(20,41,82,0.08)] hover:bg-[#FBFCFE]'
        }`}
        aria-expanded={open}
        aria-label={`Cambiar edificio desde ${buildingName}`}
      >
        <BuildingIcon compact={size === 'compact'} />
        <ChipLabel buildingName={buildingName} label={label} />
        <ChevronBadge compact={size === 'compact'} open={open} />
      </button>

      {open ? (
        <div className="absolute left-0 z-[90] mt-3 w-[min(19rem,calc(100vw-3rem))] overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white p-2 shadow-[0_22px_55px_rgba(20,41,82,0.16)]">
          <div className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C9AB3]">
            Edificios
          </div>

          <div className="max-h-72 overflow-y-auto pr-1">
            {buildings.map((building) => {
              const active = building.id === buildingId

              return (
                <Link
                  key={building.id}
                  href={getBuildingHref(building.id)}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-[20px] px-3 py-3 transition ${
                    active
                      ? 'bg-[#EEF4FF] text-[#2F66C8]'
                      : 'text-[#142952] hover:bg-[#F6F8FC]'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                      active
                        ? 'bg-white text-[#2F66C8]'
                        : 'bg-[#F3F6FB] text-[#8C9AB3]'
                    }`}
                  >
                    <Building2 size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold">
                      {building.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-[#8C9AB3]">
                      {building.address || 'Sin direccion'}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="mt-2 border-t border-[#E7EDF5] pt-2">
            <Link
              href={mainHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[20px] px-3 py-3 text-[#142952] transition hover:bg-[#F6F8FC]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F6FB] text-[#2F66C8]">
                <Grid3X3 size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-bold">
                  {mainLabel}
                </span>
                <span className="mt-0.5 block text-[12px] font-medium text-[#8C9AB3]">
                  {mainDescription}
                </span>
              </span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BuildingIcon({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${
        compact
          ? 'h-9 w-9 bg-[#F3F6FB] text-[#8C9AB3]'
          : 'h-9 w-9 bg-[#F3F6FB] text-[#8C9AB3]'
      }`}
    >
      <Building2 size={compact ? 14 : 15} />
    </span>
  )
}

function ChipLabel({
  buildingName,
  label,
}: {
  buildingName: string
  label: string
}) {
  return (
    <span className="min-w-0">
      <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#7B8BA8]">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-[15px] font-bold">
        {buildingName}
      </span>
    </span>
  )
}

function ChevronBadge({
  compact = false,
  open = false,
}: {
  compact?: boolean
  open?: boolean
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${
        compact
          ? 'h-9 w-9 bg-[#F3F6FB] text-[#8C9AB3]'
          : 'h-8 w-8 bg-[#F3F6FB] text-[#8C9AB3]'
      }`}
    >
      <ChevronDown
        size={compact ? 15 : 16}
        className={`transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </span>
  )
}
