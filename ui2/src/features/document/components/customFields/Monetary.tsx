import {NumberInput} from "@mantine/core"
import {useEffect, useState} from "react"
import {CustomFieldArgs} from "./types"

type MonetaryExtraDataType = {
  currency: string
}

function getCurrency(
  extraData?: string | MonetaryExtraDataType
): string | undefined {
  if (!extraData) {
    return
  }

  if (typeof extraData == "string") {
    const extra_data = JSON.parse(extraData) as MonetaryExtraDataType

    if (extra_data) {
      return extra_data.currency
    }

    return
  }

  if (extraData.currency) {
    return extraData.currency
  }

  return
}

export default function CustomFieldMonetary({
  customField,
  onChange
}: CustomFieldArgs) {
  const [value, setValue] = useState<string | number>(
    customField.value ? customField.value.toString() : ""
  )
  const currency = getCurrency(customField.extra_data)

  const onLocalChange = (v: number | string) => {
    setValue(v)
    onChange({customField, value: v.toString()})
  }

  useEffect(() => {
    setValue(customField.value ? customField.value.toString() : "")
  }, [customField.value])

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
