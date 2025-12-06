import {Checkbox, Group} from "@mantine/core"
import {useCallback, useEffect, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {BooleanFieldProps} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * Boolean custom field input with auto-save
 *
 * Fixes from original:
 * - Correctly accesses customField.value?.value?.raw for the value
 * - Uses customField.custom_field.name for label
 * - Sends boolean value directly (not converted to string)
 */
export function BooleanField({
  customField,
  documentId,
  disabled = false
}: BooleanFieldProps) {
  // Extract the raw boolean value correctly
  const rawValue = customField?.value?.value?.raw
  const initialValue =
    rawValue === true || rawValue === "true" || rawValue === 1

  const [checked, setChecked] = useState<boolean>(initialValue)

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id
  })

  // Sync with external value changes
  useEffect(() => {
    const newRawValue = customField?.value?.value?.raw
    const newChecked =
      newRawValue === true || newRawValue === "true" || newRawValue === 1
    setChecked(newChecked)
  }, [customField?.value?.value?.raw])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.currentTarget.checked
      setChecked(newValue)
      // Send boolean directly - backend BooleanTypeHandler handles conversion
      save(newValue)
    },
    [save]
  )

  const label = customField?.custom_field?.name ?? ""

  return (
    <Group gap="xs" align="center">
      <Checkbox
        checked={checked}
        onChange={handleChange}
        label={label}
        disabled={disabled}
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default BooleanField
