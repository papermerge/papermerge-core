import {EditCustomFieldModalPresentation} from "./EditCustomFieldModal.presentation"
import {useEditCustomFieldModal} from "./useEditCustomFieldModal"

interface EditCustomFieldModalContainerProps {
  opened: boolean
  customFieldId: string
  onSubmit: () => void
  onCancel: () => void
}

/**
 * Container component for EditCustomFieldModal
 *
 * Connects the useEditCustomFieldModal hook with the presentation component.
 * Manages form state, validation, and API calls for editing custom fields.
 */
export function EditCustomFieldModalContainer({
  opened,
  customFieldId,
  onSubmit,
  onCancel
}: EditCustomFieldModalContainerProps) {
  const {
    name,
    dataType,
    currency,
    owner,
    selectOptions,
    optionValuesChangesTotal,
    error,
    isLoading,
    isUpdating,
    isDataLoaded,
    isSelectType,
    onNameChange,
    onDataTypeChange,
    onCurrencyChange,
    onOwnerChange,
    onSelectOptionsChange,
    onLocalSubmit,
    formReset
  } = useEditCustomFieldModal({customFieldId, onSubmit})

  const handleClose = () => {
    formReset()
    onCancel()
  }

  const handleCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <EditCustomFieldModalPresentation
      opened={opened}
      onClose={handleClose}
      name={name}
      dataType={dataType}
      currency={currency}
      owner={owner}
      selectOptions={selectOptions}
      error={error}
      isLoading={isLoading}
      isUpdating={isUpdating}
      isDataLoaded={isDataLoaded}
      isSelectType={isSelectType}
      optionValuesChangesTotal={optionValuesChangesTotal}
      onNameChange={onNameChange}
      onDataTypeChange={onDataTypeChange}
      onCurrencyChange={onCurrencyChange}
      onOwnerChange={onOwnerChange}
      onSelectOptionsChange={onSelectOptionsChange}
      onSubmit={onLocalSubmit}
      onCancel={handleCancel}
    />
  )
}

// Default export for backward compatibility
export default EditCustomFieldModalContainer
