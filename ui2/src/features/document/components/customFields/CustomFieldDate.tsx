import type {DocumentCustomFieldValue} from "@/types"
import {rem} from "@mantine/core"
import {DatePickerInput, DateValue} from "@mantine/dates"
import {IconCalendar} from "@tabler/icons-react"
import dayjs from "dayjs"
import {useEffect, useState} from "react"

type onChangeArgs = {
  customField: DocumentCustomFieldValue
  value: string
}

type onChangeType = ({customField, value}: onChangeArgs) => void

interface Args {
  customField: DocumentCustomFieldValue
  onChange: onChangeType
}

export default function CustomFieldDate({customField, onChange}: Args) {
  const [value, setValue] = useState<Date | null>(null)
  const icon = (
    <IconCalendar style={{width: rem(18), height: rem(18)}} stroke={1.5} />
  )

  useEffect(() => {
    if (customField.value && customField.value.length > 0) {
      const parts = customField.value.split("-")
      const year = Number(parts[0])
      const month = Number(parts[1]) - 1
      const day = Number(parts[2].substring(0, 2))

      const date = new Date(year, month, day)
      setValue(date)
    }
  }, [])

  const onLocalChange = (value: DateValue) => {
    if (value) {
      const d = dayjs(value)
      const DATE_FORMAT = "YYYY-MM-DD"
      const strValue = d.format(DATE_FORMAT)
      onChange({customField, value: strValue})
    }
    setValue(value)
  }

  return (
    <DatePickerInput
      leftSection={icon}
      leftSectionPointerEvents="none"
      clearable
      // `valueFormat` will be retrieved from user preferences
      valueFormat="DD.MM.YYYY"
      label={customField.name}
      placeholder="Pick date"
      value={value}
      onChange={onLocalChange}
    />
  )
}
