import {NumberInput} from "@mantine/core"
import {useState} from "react"
import {CustomFieldArgs} from "./types"

type MonetaryExtraDataType = {
  currency: string
}

function getCurrency(extraData?: string): string | undefined {
  if (!extraData) {
    return
  }

  const extra_data = JSON.parse(extraData) as MonetaryExtraDataType

  if (extra_data) {
    return extra_data.currency
  }

  return
}

export default function CustomFieldMonetary({
  customField,
  onChange
}: CustomFieldArgs) {
  const [value, setValue] = useState<string | number>(customField.value)
  const currency = getCurrency(customField.extra_data)

  const onLocalChange = (v: number | string) => {
    setValue(v)
    onChange({customField, value: v.toString()})
  }

  return (
    <NumberInput
      label={customField.name}
      decimalScale={2}
      fixedDecimalScale
      suffix={` ${currency}`} // one space
      onChange={onLocalChange}
      value={value}
    />
  )
}
