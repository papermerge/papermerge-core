import {CURRENCIES} from "@/cconstants"
import OwnerSelect from "@/components/OwnerSelect"
import type {SelectOption} from "@/features/custom-fields/components/SelectOptions"
import {SelectOptionsContainer} from "@/features/custom-fields/components/SelectOptions"
import {getCustomFieldTypes} from "@/features/custom-fields/utils"
import type {CurrencyType, CustomFieldDataType, Owner} from "@/types"
import {
  Button,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Select,
  Text,
  TextInput
} from "@mantine/core"
import {useTranslation} from "react-i18next"

interface NewCustomFieldModalPresentationProps {
  // Modal state
  opened: boolean
  onClose: () => void

  // Form state
  name: string
  dataType: CustomFieldDataType
  currency: CurrencyType
  owner: Owner
  error: string

  // Mutation state
  isLoading: boolean
  isError: boolean

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
 * Presentation component for NewCustomFieldModal
 *
 * Renders the modal form for creating a new custom field.
 * Supports all field types including select and multiselect with options configuration.
 */
export function NewCustomFieldModalPresentation({
  opened,
  onClose,
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
  onSubmit,
  onCancel
}: NewCustomFieldModalPresentationProps) {
  const {t} = useTranslation()

  return (
    <Modal
      title={t("custom_fields.new.title", {defaultValue: "New Custom Field"})}
      opened={opened}
      onClose={onClose}
      size={isSelectType ? "lg" : "md"}
    >
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
          data={CURRENCIES}
          onChange={onCurrencyChange}
        />
      )}

      {isSelectType && (
        <SelectOptionsContainer
          onChange={onSelectOptionsChange}
          disabled={isLoading}
        />
      )}

      <OwnerSelect value={owner} onChange={onOwnerChange} />

      {isError && (
        <Text c="red" mt="sm">
          {error}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          {t("common.cancel", {defaultValue: "Cancel"})}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onSubmit}>
            {t("common.submit", {defaultValue: "Submit"})}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}

export default NewCustomFieldModalPresentation
