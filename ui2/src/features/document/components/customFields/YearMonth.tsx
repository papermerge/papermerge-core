import {rem} from "@mantine/core"
import {DateValue, MonthPickerInput} from "@mantine/dates"
import {IconCalendar} from "@tabler/icons-react"
import dayjs from "dayjs"
import {useEffect, useState} from "react"
import {CustomFieldArgs} from "./types"

export default function CustomFieldYearMonth({
  customField,
  onChange
}: CustomFieldArgs) {
  const [value, setValue] = useState<Date | null>(null)
  const icon = (
    <IconCalendar style={{width: rem(18), height: rem(18)}} stroke={1.5} />
  )

  useEffect(() => {
    if (customField.value && customField.value.toString().length > 0) {
      const parts = customField.value.toString().split("-")
      if (parts.length < 2) {
        setValue(null)
      } else {
        const year = Number(parts[0])
        const month = Number(parts[1]) - 1

        const date = new Date(year, month, 1)
        setValue(date)
      }
    }
  }, [customField.value])

  console.log(`customField.value=${customField.value}`)

  const onLocalChange = (value: DateValue) => {
    if (value) {
      const d = dayjs(value)
      const DATE_FORMAT = "YYYY-MM"
      const strValue = d.format(DATE_FORMAT)
      onChange({customField, value: strValue})
    } else {
      onChange({customField, value: ""})
    }
    setValue(value)
  }

  return (
    <MonthPickerInput
      leftSection={icon}
      leftSectionPointerEvents="none"
      clearable
      // `valueFormat` will be retrieved from user preferences
      valueFormat="YYYY.MM"
      label={customField.name}
      placeholder="Pick date"
      value={value}
      onChange={onLocalChange}
    />
  )
}
