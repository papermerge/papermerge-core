import OwnerSelect from "@/components/OwnerSelect"
import type {SelectOption} from "@/features/custom-fields/components/SelectOptions"
import {SelectOptionsContainer} from "@/features/custom-fields/components/SelectOptions"
import {
  getCurrencies,
  getCustomFieldTypes
} from "@/features/custom-fields/utils"
import type {CurrencyType, CustomFieldDataType, Owner} from "@/types"
import {
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  NativeSelect,
  Select,
  Text,
  TextInput
} from "@mantine/core"
import {useTranslation} from "react-i18next"

interface EditCustomFieldModalPresentationProps {
  // Modal state
  opened: boolean
  onClose: () => void

  // Form state
  name: string
  dataType: CustomFieldDataType
  currency: CurrencyType
  owner: Owner
  selectOptions: SelectOption[]
  error: string

  // Query/Mutation state
  isLoading: boolean
  isUpdating: boolean
  isDataLoaded: boolean

  // Computed
  isSelectType: boolean

  // Actions
  onNameChange: (value: string) => void
  onDataTypeChange: (value: CustomFieldDataType) => void
  onCurrencyChange: (value: string | null) => void
  onOwnerChange: (newOwner: Owner) => void
  onSelectOptionsChange: (options: SelectOption[]) => void
  onSubmit: () => void
  onCancel: () => void
}

/**
 * Presentation component for EditCustomFieldModal
 *
 * Renders the modal form for editing an existing custom field.
 * Supports all field types including select and multiselect with options configuration.
 */
export function EditCustomFieldModalPresentation({
  opened,
  onClose,
  name,
  dataType,
  currency,
  owner,
  selectOptions,
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
  onSubmit,
  onCancel
}: EditCustomFieldModalPresentationProps) {
  const {t} = useTranslation()

  return (
    <Modal
      title={t("custom_fields.edit.title", {defaultValue: "Edit Custom Field"})}
      opened={opened}
      onClose={onClose}
      size={isSelectType ? "lg" : "md"}
      transitionProps={{duration: 0}}
    >
      <LoadingOverlay
        visible={!isDataLoaded}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />

      <TextInput
        label={t("custom_fields.form.name", {defaultValue: "Name"})}
        value={name}
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder={t("custom_fields.form.name", {defaultValue: "Name"})}
      />

      <NativeSelect
        mt="sm"
        label={t("custom_fields.form.type", {defaultValue: "Type"})}
        value={dataType}
        data={getCustomFieldTypes(t)}
        onChange={e =>
          onDataTypeChange(e.currentTarget.value as CustomFieldDataType)
        }
      />

      {dataType === "monetary" && (
        <Select
          mt="sm"
          searchable
          label={t("custom_fields.form.currency", {defaultValue: "Currency"})}
          value={currency}
          data={getCurrencies(t)}
          onChange={onCurrencyChange}
        />
      )}

      {isSelectType && (
        <SelectOptionsContainer
          onChange={onSelectOptionsChange}
          initialOptions={selectOptions.length > 0 ? selectOptions : undefined}
          disabled={isUpdating}
        />
      )}

      <OwnerSelect value={owner} onChange={onOwnerChange} />

      {error && (
        <Text c="red" mt="sm">
          {error}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          {t("common.cancel", {defaultValue: "Cancel"})}
        </Button>
        <Group>
          {isUpdating && <Loader size="sm" />}
          <Button disabled={isUpdating} onClick={onSubmit}>
            {t("common.update", {defaultValue: "Update"})}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}

export default EditCustomFieldModalPresentation
