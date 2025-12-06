import {Group, Select} from "@mantine/core"
import {useCallback, useEffect, useMemo, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {SelectConfig, SelectFieldProps, SelectOption} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * Select custom field input with auto-save
 */
export function SelectField({
  customField,
  documentId,
  disabled = false
}: SelectFieldProps) {
  const rawValue = customField?.value?.value?.raw
  const [value, setValue] = useState<string | null>(rawValue ?? null)

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id
  })

  const label = customField?.custom_field?.name ?? ""

  // Extract config
  const config = useMemo(() => {
    const cfConfig = customField?.custom_field
      ?.config as unknown as SelectConfig
    return cfConfig ?? {options: []}
  }, [customField?.custom_field?.config])

  const options: SelectOption[] = useMemo(
    () => config.options ?? [],
    [config.options]
  )

  // Transform options for Mantine Select
  const selectData = useMemo(
    () =>
      options.map(opt => ({
        value: opt.value,
        label: opt.label
      })),
    [options]
  )

  // Sync with external value changes
  useEffect(() => {
    setValue(customField?.value?.value?.raw ?? null)
  }, [customField?.value?.value?.raw])

  const handleChange = useCallback(
    (newValue: string | null) => {
      setValue(newValue)
      save(newValue ?? "")
    },
    [save]
  )

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <Select
        style={{flex: 1}}
        label={label}
        value={value}
        data={selectData}
        onChange={handleChange}
        disabled={disabled}
        clearable
        searchable
        placeholder="Select an option"
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default SelectField
