'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown, Grid3X3 } from 'lucide-react'
import { useLocale } from 'next-intl'

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
  appearance?: 'default' | 'embedded'
  onOpenChange?: (open: boolean) => void
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
  appearance = 'default',
  onOpenChange,
}: ManagerBuildingChipProps) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const hasMenu = buildings.length > 1
  const updateOpen = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [onOpenChange]
  )
  const localizedMainHref = mainHref.startsWith(`/${locale}/`)
    ? mainHref
    : `/${locale}${mainHref.startsWith('/') ? mainHref : `/${mainHref}`}`

  const toLocalizedHref = (href: string) =>
    href.startsWith(`/${locale}/`)
      ? href
      : `/${locale}${href.startsWith('/') ? href : `/${href}`}`

  const handleOpenMain = () => {
    updateOpen(false)
    window.location.assign(localizedMainHref)
  }

  const handleOpenBuilding = (nextBuildingId: string) => {
    updateOpen(false)
    window.location.assign(toLocalizedHref(getBuildingHref(nextBuildingId)))
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        updateOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open, updateOpen])

  const shellClass =
    appearance === 'embedded'
      ? size === 'compact'
        ? 'gap-2 bg-transparent px-0 py-0 text-[#142952] shadow-none backdrop-blur-0'
        : 'gap-3 bg-transparent px-0 py-0 shadow-none'
      : size === 'compact'
        ? 'gap-2 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm'
        : 'gap-3 rounded-full border border-[#E7EDF5] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(20,41,82,0.08)]'

  if (!hasMenu && singleBuildingMode === 'static') {
    return (
      <div
        className={`inline-flex max-w-full items-center transition ${shellClass}`}
        aria-label={`Edificio actual: ${buildingName}`}
      >
        {size === 'compact' ? (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F6FB] text-[#8C9AB3]">
              <Building2 size={15} />
            </span>

            <span className="text-[13px] text-[#6E7F9D]">{label}</span>

            <span className="max-w-[190px] truncate text-[14px] font-semibold text-[#142952]">
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
      <button
        type="button"
        onClick={handleOpenMain}
        className={`inline-flex max-w-full items-center transition ${shellClass} ${
          appearance === 'embedded'
            ? ''
            : size === 'compact'
              ? 'hover:bg-white'
              : 'hover:bg-[#FBFCFE]'
        }`}
        aria-label={`Cambiar edificio desde ${buildingName}`}
      >
        <BuildingIcon compact={size === 'compact'} />
        <ChipLabel buildingName={buildingName} label={label} />
        <ChevronBadge compact={size === 'compact'} />
      </button>
    )
  }

  return (
    <div ref={menuRef} className="relative inline-block min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => updateOpen(!open)}
        className={`inline-flex max-w-full items-center text-left transition ${shellClass} ${
          appearance === 'embedded'
            ? ''
            : size === 'compact'
              ? 'hover:bg-white'
              : 'hover:bg-[#FBFCFE]'
        }`}
        aria-expanded={open}
        aria-label={`Cambiar edificio desde ${buildingName}`}
      >
        <BuildingIcon compact={size === 'compact'} />
        <ChipLabel buildingName={buildingName} label={label} />
        <ChevronBadge compact={size === 'compact'} open={open} />
      </button>

      {open ? (
        <div className="absolute left-0 z-[220] mt-2 w-max min-w-full max-w-[min(20rem,calc(100vw-3.5rem))] overflow-hidden rounded-[22px] border border-[#E7EDF5] bg-white p-1.5 shadow-[0_18px_40px_rgba(20,41,82,0.14)]">
          <div className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C9AB3]">
            Edificios
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            {buildings.map((building) => {
              const active = building.id === buildingId

              return (
                <button
                  key={building.id}
                  type="button"
                  onClick={() => handleOpenBuilding(building.id)}
                  className={`flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition ${
                    active
                      ? 'bg-[#EEF4FF] text-[#2F66C8]'
                      : 'text-[#142952] hover:bg-[#F6F8FC]'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] ${
                      active
                        ? 'bg-white text-[#2F66C8]'
                        : 'bg-[#F3F6FB] text-[#8C9AB3]'
                    }`}
                  >
                    <Building2 size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold">
                      {building.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-[#8C9AB3]">
                      {building.address || 'Sin direccion'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-1.5 border-t border-[#E7EDF5] pt-1.5">
            <button
              type="button"
              onClick={handleOpenMain}
              className="flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left text-[#142952] transition hover:bg-[#F6F8FC]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-[#F3F6FB] text-[#2F66C8]">
                <Grid3X3 size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold">
                  {mainLabel}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#8C9AB3]">
                  {mainDescription}
                </span>
              </span>
            </button>
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
