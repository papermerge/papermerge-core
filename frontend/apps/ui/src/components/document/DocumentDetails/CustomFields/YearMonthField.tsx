import {Group, rem} from "@mantine/core"
import {DateValue, MonthPickerInput} from "@mantine/dates"
import {IconCalendar} from "@tabler/icons-react"
import dayjs from "dayjs"
import {useCallback, useEffect, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {YearMonthFieldProps} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * YearMonth custom field input with auto-save
 */
export function YearMonthField({
  customField,
  documentId,
  disabled = false
}: YearMonthFieldProps) {
  const [value, setValue] = useState<Date | null>(null)

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id
  })

  const label = customField?.custom_field?.name ?? ""

  const icon = (
    <IconCalendar style={{width: rem(18), height: rem(18)}} stroke={1.5} />
  )

  // Parse yearmonth from raw value (format: "YYYY-MM")
  const parseYearMonth = useCallback((raw: unknown): Date | null => {
    if (!raw) return null

    const rawStr = String(raw)
    const parts = rawStr.split("-")

    if (parts.length < 2) return null

    const year = Number(parts[0])
    const month = Number(parts[1]) - 1 // JS months are 0-indexed

    if (isNaN(year) || isNaN(month)) return null

    return new Date(year, month, 1)
  }, [])

  // Sync with external value changes
  useEffect(() => {
    setValue(parseYearMonth(customField?.value?.value?.raw))
  }, [customField?.value?.value?.raw, parseYearMonth])

  const handleChange = useCallback(
    (newValue: DateValue) => {
      const dateValue = newValue instanceof Date ? newValue : null
      setValue(dateValue)

      if (newValue) {
        const formatted = dayjs(newValue).format("YYYY-MM")
        save(formatted)
      } else {
        save("")
      }
    },
    [save]
  )

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <MonthPickerInput
        style={{flex: 1}}
        leftSection={icon}
        leftSectionPointerEvents="none"
        clearable
        valueFormat="YYYY.MM"
        label={label}
        placeholder="Pick month"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default YearMonthField
