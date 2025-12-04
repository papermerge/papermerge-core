import type {CustomFieldWithValue} from "@/types"
import {useCallback, useEffect, useMemo, useState} from "react"
import type {SelectConfig, SelectOption} from "./types"

interface UseSelectCustomFieldArgs {
  customField: CustomFieldWithValue
  onChange: (args: {customField: CustomFieldWithValue; value: string}) => void
}

interface UseSelectCustomFieldReturn {
  value: string | null
  options: SelectOption[]
  label: string
  handleChange: (value: string | null) => void
}

/**
 * Hook for managing select custom field state and logic
 *
 * Handles:
 * - Extracting config and options from custom field
 * - Managing selected value state
 * - Syncing with external value changes
 * - Notifying parent of changes
 */
export function useSelectCustomField({
  customField,
  onChange
}: UseSelectCustomFieldArgs): UseSelectCustomFieldReturn {
  const [value, setValue] = useState<string | null>(
    customField?.value?.value?.raw ?? null
  )

  // Extract config from custom field
  const config = useMemo(() => {
    const cfConfig = customField?.custom_field
      ?.config as unknown as SelectConfig
    return cfConfig ?? {options: []}
  }, [customField?.custom_field?.config])

  const options = useMemo(() => config.options ?? [], [config.options])

  const label = customField?.custom_field?.name ?? ""

  // Sync with external value changes
  useEffect(() => {
    setValue(customField?.value?.value?.raw ?? null)
  }, [customField?.value?.value?.raw])

  const handleChange = useCallback(
    (newValue: string | null) => {
      setValue(newValue)
      onChange({customField, value: newValue ?? ""})
    },
    [customField, onChange]
  )

  return {
    value,
    options,
    label,
    handleChange
  }
}

export default useSelectCustomField
