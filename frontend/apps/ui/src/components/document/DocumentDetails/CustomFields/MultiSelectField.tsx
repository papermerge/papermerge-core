import {Group, MultiSelect} from "@mantine/core"
import {useCallback, useEffect, useMemo, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {
  MultiSelectConfig,
  MultiSelectFieldProps,
  SelectOption
} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * MultiSelect custom field input with auto-save
 *
 * Fixes from original:
 * - Sends array directly to backend instead of comma-separated string
 * - Backend MultiSelectTypeHandler expects array and handles conversion
 * - Properly parses both array and string values from backend
 */
export function MultiSelectField({
  customField,
  documentId,
  disabled = false
}: MultiSelectFieldProps) {
  // Parse initial value - backend can return array or string
  const parseValue = useCallback((raw: unknown): string[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String)
    if (typeof raw === "string") {
      // Handle comma-separated string (legacy or edge case)
      return raw
        .split(",")
        .map(v => v.trim())
        .filter(Boolean)
    }
    return []
  }, [])

  const [values, setValues] = useState<string[]>(
    parseValue(customField?.value?.value?.raw)
  )

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id
  })

  // Extract config
  const config = useMemo(() => {
    const cfConfig = customField?.custom_field
      ?.config as unknown as MultiSelectConfig
    return cfConfig ?? {options: []}
  }, [customField?.custom_field?.config])

  const options: SelectOption[] = useMemo(
    () => config.options ?? [],
    [config.options]
  )

  const label = customField?.custom_field?.name ?? ""

  // Transform options for Mantine MultiSelect
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
    setValues(parseValue(customField?.value?.value?.raw))
  }, [customField?.value?.value?.raw, parseValue])

  const handleChange = useCallback(
    (newValues: string[]) => {
      setValues(newValues)
      // Send array directly - backend MultiSelectTypeHandler handles it
      // Empty array should be sent as empty array, not null
      save(newValues.length > 0 ? newValues : [])
    },
    [save]
  )

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <MultiSelect
        style={{flex: 1}}
        label={label}
        value={values}
        data={selectData}
        onChange={handleChange}
        disabled={disabled}
        clearable
        searchable
        placeholder="Select options"
        hidePickedOptions
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default MultiSelectField
