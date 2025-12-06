import {Group, rem} from "@mantine/core"
import {DatePickerInput, DateValue} from "@mantine/dates"
import {IconCalendar} from "@tabler/icons-react"
import dayjs from "dayjs"
import {useCallback, useEffect, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {DateFieldProps} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * Date custom field input with auto-save
 */
export function DateField({
  customField,
  documentId,
  disabled = false
}: DateFieldProps) {
  const [value, setValue] = useState<Date | null>(null)

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id
  })

  const label = customField?.custom_field?.name ?? ""

  const icon = (
    <IconCalendar style={{width: rem(18), height: rem(18)}} stroke={1.5} />
  )

  // Parse date from raw value
  const parseDate = useCallback((raw: unknown): Date | null => {
    if (!raw) return null

    const rawStr = String(raw)
    const parts = rawStr.split("-")

    if (parts.length < 3) return null

    const year = Number(parts[0])
    const month = Number(parts[1]) - 1 // JS months are 0-indexed
    const day = Number(parts[2].substring(0, 2)) // Handle "YYYY-MM-DD HH:mm:ss" format

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null

    return new Date(year, month, day)
  }, [])

  // Sync with external value changes
  useEffect(() => {
    setValue(parseDate(customField?.value?.value?.raw))
  }, [customField?.value?.value?.raw, parseDate])

  const handleChange = useCallback(
    (newValue: DateValue) => {
      const dateValue = newValue instanceof Date ? newValue : null
      setValue(dateValue)

      if (newValue) {
        const formatted = dayjs(newValue).format("YYYY-MM-DD")
        save(formatted)
      } else {
        save("")
      }
    },
    [save]
  )

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <DatePickerInput
        style={{flex: 1}}
        leftSection={icon}
        leftSectionPointerEvents="none"
        clearable
        valueFormat="DD.MM.YYYY"
        label={label}
        placeholder="Pick date"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default DateField
