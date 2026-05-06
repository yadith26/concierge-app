'use client'

import { CalendarDays, ClipboardCheck, X } from 'lucide-react'
import type { OwnerRequestItem } from '@/lib/owner-requests/ownerRequestHelpers'

type OwnerRequestsModalProps = {
  open: boolean
  loading: boolean
  error: string
  requests: OwnerRequestItem[]
  onClose: () => void
  onArchive: (requestId: string) => void
  onConvert: (request: OwnerRequestItem) => void
}

export default function OwnerRequestsModal({
  open,
  loading,
  error,
  requests,
  onClose,
  onArchive,
  onConvert,
}: OwnerRequestsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="flex h-[min(78vh,680px)] w-full max-w-md flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF3F8] px-5 py-4">
          <div>
            <h3 className="text-xl font-bold text-[#142952]">Eventos del manager</h3>
            <p className="mt-1 text-sm text-[#6E7F9D]">
              Revisa los eventos y conviertelos en tarea cuando quieras.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] p-2 text-[#6E7F9D]"
            aria-label="Cerrar eventos"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[#FBFCFF] px-4 py-4">
          {loading ? <p className="text-sm text-[#7B8BA8]">Cargando eventos...</p> : null}

          {error ? (
            <div className="rounded-[24px] border border-[#F1D3D3] bg-[#FFF5F5] px-4 py-4 text-sm font-medium text-[#C53030]">
              {error}
            </div>
          ) : null}

          {!loading && !error && requests.length === 0 ? (
            <div className="rounded-[24px] border border-[#E7EDF5] bg-white px-4 py-5 text-sm text-[#7B8BA8]">
              No hay eventos pendientes del manager.
            </div>
          ) : null}

          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-[24px] border border-[#E3EAF3] bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#F2EEFF] px-3 py-1 text-xs font-semibold text-[#7A4DE8]">
                      Evento
                    </span>
                    <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                      {request.status === 'pending' ? 'Nuevo' : 'Visto'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#142952]">
                    {request.title}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-sm text-[#6E7F9D]">
                    <CalendarDays size={14} />
                    <span>{request.suggested_date || 'Sin fecha sugerida'}</span>
                  </div>

                  <p className="mt-1 text-sm text-[#6E7F9D]">
                    {request.apartment_or_area || 'Sin ubicacion'}
                  </p>

                  {request.description ? (
                    <p className="mt-2 text-sm leading-6 text-[#4E5F7C]">
                      {request.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onArchive(request.id)}
                  className="flex-1 rounded-2xl border border-[#D9E0EA] px-4 py-3 text-sm font-semibold text-[#6E7F9D]"
                >
                  Archivar
                </button>

                <button
                  type="button"
                  onClick={() => onConvert(request)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2F66C8] px-4 py-3 text-sm font-semibold text-white"
                >
                  <ClipboardCheck size={16} />
                  Crear tarea
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

