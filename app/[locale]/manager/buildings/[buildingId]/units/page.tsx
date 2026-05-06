'use client'

import { useCallback, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  Copy,
  Image as ImageIcon,
  MessageSquareMore,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import {
  type BuildingUnitsSummary,
  type BuildingUnit,
  type UnitGroup,
  useManagerUnitsPage,
} from '@/hooks/useManagerUnitsPage'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import HeaderProfileButton from '@/components/layout/HeaderProfileButton'
import ManagerUnitsContent, {
  BuildingSummaryStrip,
} from '@/components/manager/units/ManagerUnitsContent'
import BuildingUnitFormModal from '@/components/manager/units/BuildingUnitFormModal'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { updateBuilding } from '@/lib/buildings/buildingMembershipService'
import {
  removeBuildingPhoto,
  uploadBuildingPhoto,
} from '@/lib/buildings/buildingPhotoActions'

export default function ManagerUnitsPage() {
  const router = useRouter()
  const locale = useLocale()
  const params = useParams<{ buildingId: string }>()
  const searchParams = useSearchParams()
  const buildingId = params.buildingId
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const headerConversation = useHeaderConversation({ preferredBuildingId: buildingId })
  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)
  const [editBuildingOpen, setEditBuildingOpen] = useState(false)
  const [unitModalOpen, setUnitModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<BuildingUnit | null>(null)

  const initialSearch = searchParams.get('search') || ''
  const initialGroup = (searchParams.get('group') as UnitGroup | null) || null
  const rawInitialFilter = searchParams.get('filter')
  const initialFilter =
    rawInitialFilter === 'occupied' ||
    rawInitialFilter === 'available' ||
    rawInitialFilter === 'expiring_soon' ||
    rawInitialFilter === 'problematic' ||
    rawInitialFilter === 'all'
      ? rawInitialFilter
      : null
  const handleRedirect = useCallback(
    (path: '/login' | '/manager') => router.replace(path),
    [router]
  )
  const unitsPage = useManagerUnitsPage({
    buildingId,
    initialFilter,
    initialSearch,
    initialGroup,
    onRedirect: handleRedirect,
  })

  const {
    activeGroup,
    building,
    filteredBuildingUnits,
    filteredUnits,
    loading,
    search,
    setActiveGroup,
    setSearch,
    setUnitFilter,
    sortedApartments,
    sortedBuildingUnits,
    sortedCommonAreas,
    unitFilter,
    unitSummary,
    refresh,
  } = unitsPage

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="relative mx-auto h-screen w-full max-w-md overflow-hidden bg-[#F6F8FC]">
          <CompactBuildingUnitsBar
            compact={compactHeader}
            name={building?.name || 'Edificio'}
            onBack={() => router.push('/manager/buildings')}
            onOpenMessages={
              headerConversation.canOpenConversation
                ? () => {
                    void headerConversation.openInbox()
                  }
                : null
            }
            unreadCount={headerConversation.unreadCount}
          />

          <section
            ref={scrollRef}
            className="h-full overflow-y-auto pb-40"
          >
          <BuildingUnitsHeader
            address={building?.address || null}
            compact={false}
            inviteCode={building?.invite_code || null}
            name={building?.name || 'Edificio'}
            onBack={() => router.push('/manager/buildings')}
            onEdit={() => setEditBuildingOpen(true)}
            onOpenMessages={
              headerConversation.canOpenConversation
                ? () => {
                    void headerConversation.openInbox()
                  }
                : null
            }
            summary={unitSummary}
            photoUrl={building?.building_photo_url || null}
            unreadCount={headerConversation.unreadCount}
          />

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[#6E7F9D]">
                Loading apartment history...
              </div>
            ) : (
              <div className="px-4 pt-3">
                <ManagerUnitsContent
                  activeGroup={activeGroup}
                  buildingId={buildingId}
                  filteredBuildingUnits={filteredBuildingUnits}
                  filteredUnits={filteredUnits}
                  search={search}
                  sortedApartments={sortedApartments}
                  sortedBuildingUnits={sortedBuildingUnits}
                  sortedCommonAreas={sortedCommonAreas}
                  unitFilter={unitFilter}
                  onSearchChange={setSearch}
                  onGroupChange={setActiveGroup}
                  onEditUnit={(unit) => {
                    setEditingUnit(unit)
                    setUnitModalOpen(true)
                  }}
                  onUnitFilterChange={setUnitFilter}
                />
              </div>
            )}
          </section>

          {building ? (
            <button
              type="button"
              onClick={() => {
                setEditingUnit(null)
                setUnitModalOpen(true)
              }}
              className="absolute bottom-24 right-5 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-[#4666D9] text-white shadow-[0_18px_34px_rgba(70,102,217,0.32)]"
              aria-label="Agregar apartamento"
            >
              <Plus size={30} />
            </button>
          ) : null}

          {building ? (
            <div className="absolute inset-x-0 bottom-0 z-30">
              <ManagerBottomNav buildingId={building.id} active="units" />
            </div>
          ) : null}
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title="Mensajes"
        subtitle={headerConversation.contactName || 'Sin contacto asignado'}
        currentUserId={headerConversation.currentUserId}
        messages={headerConversation.messages}
        value={headerConversation.value}
        sending={headerConversation.sending}
        loading={headerConversation.loadingConversation}
        error={headerConversation.error}
        onChange={headerConversation.setValue}
        onClose={headerConversation.closeConversation}
        onSubmit={() => {
          void headerConversation.sendMessage()
        }}
        canSaveAsTask
        onSaveAsTask={(message) => {
          setMessageTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setMessageTaskSourceId(message.id)
          headerConversation.closeConversation()
          setMessageTaskModalOpen(true)
        }}
      />

      <GlobalMessagesInboxModal
        open={headerConversation.inboxOpen}
        conversations={headerConversation.inboxConversations}
        loading={headerConversation.loadingInbox}
        onClose={headerConversation.closeInbox}
        onSelect={(conversation) => {
          void headerConversation.openInboxConversation(conversation)
        }}
      />

      <ManagerTaskFormModal
        open={messageTaskModalOpen}
        onClose={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
        }}
        buildingId={buildingId}
        managerId={headerConversation.currentUserId}
        conciergeId={
          headerConversation.contactRole === 'concierge'
            ? headerConversation.contactId
            : null
        }
        sourceMessageId={messageTaskSourceId}
        onCreated={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
        }}
        initialValues={messageTaskDraft}
      />

      {building ? (
        <EditBuildingModal
          buildingId={building.id}
          currentAddress={building.address || ''}
          currentInviteCode={building.invite_code || ''}
          currentName={building.name}
          currentPhotoUrl={building.building_photo_url || null}
          open={editBuildingOpen}
          onClose={() => setEditBuildingOpen(false)}
          onSaved={() => {
            setEditBuildingOpen(false)
            void refresh()
          }}
        />
      ) : null}

      {building ? (
        <BuildingUnitFormModal
          buildingId={building.id}
          open={unitModalOpen}
          unit={editingUnit}
          onClose={() => {
            setUnitModalOpen(false)
            setEditingUnit(null)
          }}
          onSaved={() => {
            setUnitModalOpen(false)
            setEditingUnit(null)
            void refresh()
          }}
        />
      ) : null}
    </>
  )
}

function CompactBuildingUnitsBar({
  compact,
  name,
  onBack,
  onOpenMessages,
  unreadCount,
}: {
  compact: boolean
  name: string
  onBack: () => void
  onOpenMessages: (() => void) | null
  unreadCount: number
}) {
  return (
    <div
      className={`absolute inset-x-0 top-0 z-40 bg-white px-5 pb-3 pt-5 shadow-[0_12px_26px_rgba(20,41,82,0.08)] transition-all duration-300 ${
        compact
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] text-[#4666D9] transition hover:bg-[#EEF4FF]"
          aria-label="Volver a edificios"
        >
          <ArrowLeft size={25} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C9AB3]">
            Edificio
          </p>
          <h1 className="truncate text-base font-bold text-[#142952]">
            {name}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onOpenMessages ? (
            <button
              type="button"
              onClick={onOpenMessages}
              className="relative flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#D9E0EA] bg-white text-[#6E7F9D] shadow-[0_8px_22px_rgba(20,41,82,0.08)]"
              aria-label="Abrir mensajes"
            >
              <MessageSquareMore size={20} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D64555] px-1 text-[11px] font-bold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>
          ) : null}

          <HeaderProfileButton compact variant="manager" />
        </div>
      </div>
    </div>
  )
}

function BuildingUnitsHeader({
  address,
  compact,
  inviteCode,
  name,
  onBack,
  onEdit,
  onOpenMessages,
  photoUrl,
  summary,
  unreadCount,
}: {
  address: string | null
  compact: boolean
  inviteCode: string | null
  name: string
  onBack: () => void
  onEdit: () => void
  onOpenMessages: (() => void) | null
  photoUrl: string | null
  summary: BuildingUnitsSummary
  unreadCount: number
}) {
  const copyInviteCode = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
  }

  return (
    <header
      className={`relative z-30 shrink-0 bg-[#F6F8FC] transition-all duration-300 ${
        compact ? 'h-[82px] overflow-hidden' : 'pb-5'
      }`}
    >
      <div className="absolute inset-0 bg-white" />
      <div className="relative z-10 px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-[18px] text-[#4666D9] transition hover:bg-[#EEF4FF]"
            aria-label="Volver a edificios"
          >
            <ArrowLeft size={25} />
          </button>

          <div
            className={`min-w-0 flex-1 transition-all duration-300 ${
              compact ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8C9AB3]">
              Edificio
            </p>
            <h1 className="truncate text-base font-bold text-[#142952]">
              {name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMessages ? (
              <button
                type="button"
                onClick={onOpenMessages}
                className="relative flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#D9E0EA] bg-white text-[#6E7F9D] shadow-[0_8px_22px_rgba(20,41,82,0.08)]"
                aria-label="Abrir mensajes"
              >
                <MessageSquareMore size={20} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D64555] px-1 text-[11px] font-bold leading-none text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            <HeaderProfileButton compact variant="manager" />
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            compact
              ? 'pointer-events-none mt-0 max-h-0 overflow-hidden opacity-0'
              : 'mt-4 opacity-100'
          }`}
        >
          <div className="relative h-[146px] overflow-hidden rounded-[18px] bg-[#EAF0FF]">
            <Image
              src={photoUrl || '/login-illustration-background1.png'}
              alt=""
              fill
              priority
              sizes="390px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-[#142952]/10" />
          </div>

          <div className="mt-4">
            <h1 className="truncate text-[27px] font-bold leading-none text-[#142952]">
              {name}
            </h1>
            <p className="mt-2 truncate text-[15px] font-medium text-[#6E7F9D]">
              {address || 'Sin direccion registrada'}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-[#DCE7F5] bg-white text-sm font-bold text-[#4666D9] shadow-[0_8px_18px_rgba(20,41,82,0.06)]"
            >
              <Pencil size={16} />
              Editar edificio
            </button>
            <button
              type="button"
              onClick={() => {
                void copyInviteCode()
              }}
              disabled={!inviteCode}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-[#DCE7F5] bg-white text-sm font-bold text-[#4666D9] shadow-[0_8px_18px_rgba(20,41,82,0.06)] disabled:text-[#A1AFC4]"
              title={inviteCode || 'Sin codigo'}
            >
              <Copy size={16} />
              Copiar codigo
            </button>
          </div>

          <div className="mt-4">
            <BuildingSummaryStrip summary={summary} />
          </div>
        </div>
      </div>
    </header>
  )
}

function EditBuildingModal({
  buildingId,
  currentAddress,
  currentInviteCode,
  currentName,
  currentPhotoUrl,
  onClose,
  onSaved,
  open,
}: {
  buildingId: string
  currentAddress: string
  currentInviteCode: string
  currentName: string
  currentPhotoUrl: string | null
  onClose: () => void
  onSaved: () => void
  open: boolean
}) {
  const [address, setAddress] = useState(currentAddress)
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState(currentInviteCode)
  const [name, setName] = useState(currentName)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoUrl)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    setRemovePhoto(false)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const {
        data: { user },
      } = await getSafeAuthUser()

      if (!user) {
        throw new Error('No se pudo identificar tu usuario.')
      }

      let nextPhotoUrl = removePhoto ? null : currentPhotoUrl

      if (photoFile) {
        nextPhotoUrl = await uploadBuildingPhoto({
          buildingId,
          file: photoFile,
          previousPhotoUrl: currentPhotoUrl,
        })
      } else if (removePhoto) {
        await removeBuildingPhoto(currentPhotoUrl)
      }

      await updateBuilding({
        address,
        buildingId,
        inviteCode,
        name,
        photoUrl:
          photoFile || removePhoto || currentPhotoUrl ? nextPhotoUrl : undefined,
        role: 'manager',
        userId: user.id,
      })

      onSaved()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar el edificio.'
      )
    } finally {
      setSaving(false)
    }
  }

  const copyInviteCode = async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#142952]/35 px-4 pb-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[30px] bg-white p-5 shadow-[0_24px_60px_rgba(20,41,82,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C9AB3]">
              Edificio
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#142952]">
              Editar edificio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#F3F6FB] text-[#6E7F9D]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#E3EAF3] bg-[#F8FAFE]">
          <div className="relative h-36">
            {photoPreview && !removePhoto ? (
              <Image
                src={photoPreview}
                alt=""
                fill
                sizes="390px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#EEF4FF] text-[#4666D9]">
                <ImageIcon size={42} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-bold text-[#4666D9]">
              <Camera size={15} />
              Foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelected}
                className="hidden"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-xs font-bold text-[#142952]">
              <ImageIcon size={15} />
              Subir
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setPhotoFile(null)
                setPhotoPreview(null)
                setRemovePhoto(true)
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FFF5F5] px-3 py-3 text-xs font-bold text-[#C53030]"
            >
              <Trash2 size={15} />
              Quitar
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-[22px] border border-[#E3EAF3] bg-[#F8FAFE] px-4 py-3 text-sm font-medium leading-6 text-[#6E7F9D]">
            Las cantidades de apartamentos, garajes y areas comunes se calculan
            automaticamente desde la pantalla de Unidades. Agrega lavanderia,
            piscina, gimnasio u otras areas como unidades de tipo Area comun.
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#142952]">
              Nombre
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[#142952] outline-none focus:border-[#4666D9]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#142952]">
              Direccion
            </span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[#142952] outline-none focus:border-[#4666D9]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#142952]">
              Codigo para vincular
            </span>
            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                className="h-14 min-w-0 flex-1 rounded-2xl border border-[#D9E0EA] px-4 font-mono text-sm uppercase text-[#142952] outline-none focus:border-[#4666D9]"
              />
              <button
                type="button"
                onClick={() => {
                  void copyInviteCode()
                }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D9E0EA] text-[#4666D9]"
              >
                <Copy size={20} />
              </button>
            </div>
          </label>
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
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}


