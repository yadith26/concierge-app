'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import StyledDropdown from '@/components/ui/StyledDropdown'
import type {
  BuildingUnit,
  BuildingUnitKind,
  BuildingUnitStatus,
} from '@/hooks/useManagerUnitsPage'
import {
  buildUnitFormInitialValues,
  calculateLeaseEndFromStart,
  calculateRenewedLeaseDates,
  createBuildingUnit,
  updateBuildingUnit,
  type BuildingUnitFormValues,
} from '@/lib/buildings/buildingUnitActions'

type BuildingUnitFormModalProps = {
  buildingId: string
  open: boolean
  unit: BuildingUnit | null
  onClose: () => void
  onSaved: () => void
}

const KIND_OPTIONS: Array<{ label: string; value: BuildingUnitKind }> = [
  { label: 'Apartamento', value: 'apartment' },
  { label: 'Area comun', value: 'common_area' },
  { label: 'Garaje', value: 'garage' },
  { label: 'Storage', value: 'storage' },
]

const STATUS_OPTIONS: Array<{ label: string; value: BuildingUnitStatus }> = [
  { label: 'Disponible', value: 'available' },
  { label: 'Ocupado', value: 'occupied' },
  { label: 'Proximo a vencer', value: 'expiring_soon' },
  { label: 'Problematico', value: 'problematic' },
  { label: 'Inactivo', value: 'inactive' },
]

const INPUT_CLASS =
  'h-14 w-full rounded-2xl border border-[#D9E0EA] bg-white px-4 text-sm font-semibold text-[#142952] outline-none focus:border-[#4666D9]'
const OCCUPANCY_FIELDS = new Set<keyof BuildingUnitFormValues>([
  'leaseEnd',
  'leaseStart',
  'tenantEmail',
  'tenantName',
  'tenantPhone',
])

export default function BuildingUnitFormModal({
  buildingId,
  open,
  unit,
  onClose,
  onSaved,
}: BuildingUnitFormModalProps) {
  const [values, setValues] = useState<BuildingUnitFormValues>(
    buildUnitFormInitialValues(unit)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const title = useMemo(
    () => (unit ? 'Editar unidad' : 'Agregar apartamento'),
    [unit]
  )

  useEffect(() => {
    if (!open) return

    setValues(buildUnitFormInitialValues(unit))
    setError('')
  }, [open, unit])

  if (!open) return null

  const setField = <Key extends keyof BuildingUnitFormValues>(
    key: Key,
    value: BuildingUnitFormValues[Key]
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
      leaseEnd:
        key === 'leaseStart' && String(value).trim() && !current.leaseEnd
          ? calculateLeaseEndFromStart(String(value))
          : current.leaseEnd,
      status:
        current.status === 'available' &&
        OCCUPANCY_FIELDS.has(key) &&
        String(value).trim()
          ? 'occupied'
          : current.status,
    }))
  }

  const handleRenewLease = () => {
    setValues((current) => {
      const renewedDates = calculateRenewedLeaseDates(current.leaseEnd)

      if (!renewedDates.leaseStart || !renewedDates.leaseEnd) {
        return current
      }

      return {
        ...current,
        leaseStart: renewedDates.leaseStart,
        leaseEnd: renewedDates.leaseEnd,
        status: 'occupied',
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      if (unit) {
        await updateBuildingUnit({
          buildingId,
          unitId: unit.id,
          values,
        })
      } else {
        await createBuildingUnit({
          buildingId,
          values,
        })
      }

      onSaved()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar la unidad.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#142952]/35 px-3 py-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(20,41,82,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C9AB3]">
              Edificio
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#142952]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#F3F6FB] text-[#6E7F9D]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <FormField label="Nombre o numero">
            <input
              value={values.unitLabel}
              onChange={(event) => setField('unitLabel', event.target.value)}
              placeholder="Ej: 101, Apto 15, Lobby"
              className={INPUT_CLASS}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <StyledDropdown
                ariaLabel="Seleccionar tipo de unidad"
                label="Tipo"
                value={values.unitKind}
                options={KIND_OPTIONS}
                onChange={(value) =>
                  setField('unitKind', value as BuildingUnitKind)
                }
                buttonClassName="h-14 border-[#D9E0EA] font-semibold shadow-none"
                zIndexClassName="z-[70]"
              />
            </div>

            <div>
              <StyledDropdown
                ariaLabel="Seleccionar estado de unidad"
                label="Estado"
                value={values.status}
                options={STATUS_OPTIONS}
                onChange={(value) =>
                  setField('status', value as BuildingUnitStatus)
                }
                buttonClassName="h-14 border-[#D9E0EA] font-semibold shadow-none"
                zIndexClassName="z-[70]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Piso">
              <input
                value={values.floor}
                onChange={(event) => setField('floor', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Hab.">
              <input
                value={values.bedrooms}
                onChange={(event) => setField('bedrooms', event.target.value)}
                placeholder="3 1/2"
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Banos">
              <input
                type="number"
                step="0.5"
                value={values.bathrooms}
                onChange={(event) => setField('bathrooms', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          <FormField label="Tamano">
            <input
              type="number"
              value={values.sizeSqft}
              onChange={(event) => setField('sizeSqft', event.target.value)}
              placeholder="850 ft2"
              className={INPUT_CLASS}
            />
          </FormField>

          <div className="rounded-[22px] bg-[#F8FAFE] p-4">
            <h3 className="text-sm font-bold text-[#142952]">Inquilino</h3>
            <div className="mt-3 space-y-3">
              <input
                value={values.tenantName}
                onChange={(event) => setField('tenantName', event.target.value)}
                placeholder="Nombre"
                className={INPUT_CLASS}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={values.tenantPhone}
                  onChange={(event) =>
                    setField('tenantPhone', event.target.value)
                  }
                  placeholder="Telefono"
                  className={INPUT_CLASS}
                />
                <input
                  value={values.tenantEmail}
                  onChange={(event) =>
                    setField('tenantEmail', event.target.value)
                  }
                  placeholder="Email"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Inicio contrato">
              <input
                type="date"
                value={values.leaseStart}
                onChange={(event) => setField('leaseStart', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Fin contrato">
              <input
                type="date"
                value={values.leaseEnd}
                onChange={(event) => setField('leaseEnd', event.target.value)}
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          {values.leaseEnd ? (
            <div className="rounded-[20px] border border-[#E3EAF3] bg-[#F8FAFE] px-4 py-3 text-sm font-medium leading-6 text-[#6E7F9D]">
              Si no editas la fecha de fin, se calcula un contrato de un ano.
              Cuando falten 3 meses o menos, la unidad se marcara como proxima
              a vencer.
              <button
                type="button"
                onClick={handleRenewLease}
                className="mt-3 h-11 w-full rounded-2xl bg-white text-sm font-bold text-[#4666D9] shadow-sm"
              >
                Renovar contrato por 1 ano
              </button>
            </div>
          ) : null}

          <FormField label="Disponible desde">
            <input
              type="date"
              value={values.availableSince}
              onChange={(event) => setField('availableSince', event.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Garaje">
              <input
                value={values.garageLabel}
                onChange={(event) => setField('garageLabel', event.target.value)}
                placeholder="#12"
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Storage">
              <input
                value={values.storageLabel}
                onChange={(event) => setField('storageLabel', event.target.value)}
                placeholder="#5"
                className={INPUT_CLASS}
              />
            </FormField>
          </div>

          <FormField label="Notas">
            <textarea
              value={values.notes}
              onChange={(event) => setField('notes', event.target.value)}
              rows={3}
              className={`${INPUT_CLASS} min-h-24 py-3`}
            />
          </FormField>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl bg-[#FFF5F5] px-4 py-3 text-sm font-semibold text-[#C53030]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleSave()
          }}
          disabled={saving}
          className="mt-5 h-14 w-full rounded-2xl bg-[#4666D9] text-base font-bold text-white shadow-[0_14px_28px_rgba(70,102,217,0.24)] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : unit ? 'Guardar cambios' : 'Crear unidad'}
        </button>
      </div>
    </div>
  )
}

function FormField({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#142952]">
        {label}
      </span>
      {children}
    </label>
  )
}
