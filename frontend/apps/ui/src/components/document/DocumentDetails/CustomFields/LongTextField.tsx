import {Group, Textarea} from "@mantine/core"
import {useCallback, useEffect, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {TextFieldProps} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * Text custom field input with auto-save
 */
export function LongTextField({
  customField,
  documentId,
  disabled = false
}: TextFieldProps) {
  const rawValue = customField?.value?.value?.raw ?? ""
  const [value, setValue] = useState<string>(String(rawValue))

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id,
    debounce_delay_ms: 4000
  })

  const label = customField?.custom_field?.name ?? ""

  // Sync with external value changes
  useEffect(() => {
    setValue(String(customField?.value?.value?.raw ?? ""))
  }, [customField?.value?.value?.raw])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.currentTarget.value
      setValue(newValue)
      save(newValue)
    },
    [save]
  )

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <Textarea
        style={{flex: 1}}
        label={label}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        autosize
        minRows={3}
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default LongTextField
