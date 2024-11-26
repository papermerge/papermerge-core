import {Checkbox} from "@mantine/core"
import {useEffect, useState} from "react"
import {CustomFieldArgs} from "./types"

export default function CustomFieldBoolean({
  customField,
  onChange
}: CustomFieldArgs) {
  const [value, setValue] = useState<boolean>(Boolean(customField.value))

  const onLocalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked
    setValue(value)
    onChange({customField, value: value})
  }

  useEffect(() => {
    setValue(Boolean(customField.value))
  }, [customField.value])

  return (
    <Checkbox
      checked={value}
      onChange={onLocalChange}
      label={customField.name}
    />
  )
}
