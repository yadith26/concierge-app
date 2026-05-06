'use client'

import LocationField from '@/components/locations/LocationField'
import FollowUpPrompt from '@/components/tasks/FollowUpPrompt'
import TaskFormHeader from '@/components/tasks/TaskFormHeader'
import TaskFormFooter from './TaskFormFooter'
import TaskTitleField from '@/components/tasks/TaskTitleField'
import TaskCategoryPriorityFields from '@/components/tasks/TaskCategoryPriorityFields'
import TaskDateTimeFields from '@/components/tasks/TaskDateTimeFields'
import TaskPestSection from '@/components/tasks/TaskPestSection'
import TaskPhotosSection from '@/components/tasks/TaskPhotosSection'
import TaskWarrantyAlerts from '@/components/tasks/TaskWarrantyAlerts'
import TaskNotesField from '@/components/tasks/TaskNotesField'
import { useTaskFormModal } from '@/hooks/useTaskFormModal'
import type {
  EditableTask,
  TaskCategory,
  TaskDraft,
} from '@/lib/tasks/taskTypes'

type TaskFormModalProps = {
  open: boolean
  onClose: () => void
  buildingId: string
  profileId: string
  onCreated?: () => Promise<void> | void
  taskToEdit?: EditableTask | null
  initialValues?: TaskDraft | null
  initialPhotoFile?: File | null
  sourceRequestId?: string | null
  defaultDate?: string
  defaultCategory?: TaskCategory | ''
}

export default function TaskFormModal({
  open,
  onClose,
  buildingId,
  profileId,
  onCreated,
  taskToEdit = null,
  initialValues = null,
  initialPhotoFile = null,
  sourceRequestId = null,
  defaultDate,
  defaultCategory = '',
}: TaskFormModalProps) {
  const {
    today,
    singleLocationFieldKey,
    multiLocationFieldKey,
    draftApartmentValue,
    setDraftApartmentValue,
    draftApartmentVisitType,
    setDraftApartmentVisitType,
    sanitizeApartmentValue,
    handleAddApartment,
    handleRemoveApartment,
    photos,
    existingPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
    title,
    setTitle,
    description,
    setDescription,
    locationValue,
    setLocationValue,
    category,
    setCategory,
    priority,
    setPriority,
    taskDate,
    setTaskDate,
    taskTime,
    setTaskTime,
    pestTargets,
    message,
    setMessage,
    isEditMode,
    selectedApartments,
    warrantyLoading,
    warrantyAlerts,
    smartParsed,
    tryApplySmartParsing,
    saving,
    showFollowUpPrompt,
    creatingFollowUp,
    handleClose,
    handleSubmit,
    handleCreateFollowUp,
    handleSkipFollowUp,
    togglePestTarget,
  } = useTaskFormModal({
    open,
    onClose,
    buildingId,
    profileId,
    onCreated,
    taskToEdit,
    initialValues,
    initialPhotoFile,
    sourceRequestId,
    defaultDate,
    defaultCategory,
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-md items-end sm:items-center">
        <div className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.20)] sm:h-[88vh] sm:rounded-[32px]">
          <TaskFormHeader isEditMode={isEditMode} onClose={handleClose} />

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-5 pb-6 pt-5"
          >
            <div className="space-y-5">
              <TaskTitleField
                title={title}
                category={category}
                smartParsed={smartParsed}
                onTitleChange={setTitle}
                onTryApplySmartParsing={tryApplySmartParsing}
                onUseCleanTitle={setTitle}
                onQuickSubmit={async () => {
                  await handleSubmit()
                }}
              />

              <TaskCategoryPriorityFields
                category={category}
                priority={priority}
                onCategoryChange={setCategory}
                onPriorityChange={setPriority}
              />

              <TaskDateTimeFields
                taskDate={taskDate}
                taskTime={taskTime}
                minDate={today}
                onDateChange={setTaskDate}
                onTimeChange={setTaskTime}
              />

              {category !== 'pest' ? (
                <LocationField
                  key={singleLocationFieldKey}
                  value={locationValue}
                  onChange={({ formattedValue }) => {
                    setLocationValue(formattedValue)
                  }}
                />
              ) : (
                <TaskPestSection
                  pestTargets={pestTargets}
                  onTogglePestTarget={togglePestTarget}
                  draftApartmentValue={draftApartmentValue}
                  setDraftApartmentValue={setDraftApartmentValue}
                  draftApartmentVisitType={draftApartmentVisitType}
                  setDraftApartmentVisitType={setDraftApartmentVisitType}
                  sanitizeApartmentValue={sanitizeApartmentValue}
                  selectedApartments={selectedApartments}
                  handleAddApartment={handleAddApartment}
                  handleRemoveApartment={handleRemoveApartment}
                  onMessage={setMessage}
                  currentMessage={message}
                  locationFieldKey={multiLocationFieldKey}
                />
              )}

              <TaskWarrantyAlerts
                category={category}
                loading={warrantyLoading}
                alerts={warrantyAlerts}
              />

              <TaskNotesField value={description} onChange={setDescription} />

              <TaskPhotosSection
                existingPhotos={existingPhotos}
                photos={photos}
                onSelectPhotos={handlePhotosSelected}
                onRemoveExistingPhoto={removeExistingPhoto}
                onRemoveNewPhoto={removeNewPhoto}
                onMessage={setMessage}
              />

              {message && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              )}
            </div>

            <TaskFormFooter
              isEditMode={isEditMode}
              saving={saving}
              onCancel={handleClose}
            />
          </form>
        </div>
      </div>

      <FollowUpPrompt
        open={showFollowUpPrompt}
        loading={creatingFollowUp}
        onConfirm={handleCreateFollowUp}
        onSkip={handleSkipFollowUp}
      />
    </div>
  )
}