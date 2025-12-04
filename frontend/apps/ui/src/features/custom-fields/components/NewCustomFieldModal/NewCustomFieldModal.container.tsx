import {NewCustomFieldModalPresentation} from "./NewCustomFieldModal.presentation"
import {useNewCustomFieldModal} from "./useNewCustomFieldModal"

interface NewCustomFieldModalContainerProps {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

/**
 * Container component for NewCustomFieldModal
 *
 * Connects the useNewCustomFieldModal hook with the presentation component.
 * Manages form state, validation, and API calls for creating custom fields.
 */
export function NewCustomFieldModalContainer({
  opened,
  onSubmit,
  onCancel
}: NewCustomFieldModalContainerProps) {
  const {
    name,
    dataType,
    currency,
    owner,
    error,
    isLoading,
    isError,
    isSelectType,
    onNameChange,
    onDataTypeChange,
    onCurrencyChange,
    onOwnerChange,
    onSelectOptionsChange,
    onLocalSubmit,
    reset
  } = useNewCustomFieldModal({onSubmit})

  const handleClose = () => {
    reset()
    onCancel()
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <NewCustomFieldModalPresentation
      opened={opened}
      onClose={handleClose}
      name={name}
      dataType={dataType}
      currency={currency}
      owner={owner}
      error={error}
      isLoading={isLoading}
      isError={isError}
      isSelectType={isSelectType}
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
export default NewCustomFieldModalContainer
