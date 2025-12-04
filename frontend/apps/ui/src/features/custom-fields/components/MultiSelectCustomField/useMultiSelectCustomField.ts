import type {CustomFieldWithValue} from "@/types"
import {useCallback, useEffect, useMemo, useState} from "react"
import type {MultiSelectConfig, SelectOption} from "./types"

interface UseMultiSelectCustomFieldArgs {
  customField: CustomFieldWithValue
  onChange: (args: {
    customField: CustomFieldWithValue
    value: string | boolean
  }) => void
}

interface UseMultiSelectCustomFieldReturn {
  values: string[]
  options: SelectOption[]
  label: string
  maxSelections?: number
  handleChange: (values: string[]) => void
}

/**
 * Hook for managing multiselect custom field state and logic
 *
 * Handles:
 * - Extracting config and options from custom field
 * - Managing selected values state (as array)
 * - Converting between array and comma-separated string for storage
 * - Syncing with external value changes
 * - Notifying parent of changes
 */
export function useMultiSelectCustomField({
  customField,
  onChange
}: UseMultiSelectCustomFieldArgs): UseMultiSelectCustomFieldReturn {
  // Parse initial value - can be array or comma-separated string
  const parseValue = useCallback((raw: unknown): string[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String)
    if (typeof raw === "string") {
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

  // Extract config from custom field
  const config = useMemo(() => {
    const cfConfig = customField?.custom_field
      ?.config as unknown as MultiSelectConfig
    return cfConfig ?? {options: []}
  }, [customField?.custom_field?.config])

  const options = useMemo(() => config.options ?? [], [config.options])
  const maxSelections = config.max_selections

  const label = customField?.custom_field?.name ?? ""

  // Sync with external value changes
  useEffect(() => {
    setValues(parseValue(customField?.value?.value?.raw))
  }, [customField?.value?.value?.raw, parseValue])

  const handleChange = useCallback(
    (newValues: string[]) => {
      setValues(newValues)
      // Store as comma-separated string for backend compatibility
      const stringValue = newValues.join(",")
      onChange({customField, value: stringValue})
    },
    [customField, onChange]
  )

  return {
    values,
    options,
    label,
    maxSelections,
    handleChange
  }
}

export default useMultiSelectCustomField
