import {NumberInput} from "@mantine/core"
import {useEffect, useState} from "react"
import {CustomFieldArgs} from "./types"

type MonetaryConfigType = {
  currency: string
}

export default function CustomFieldMonetary({
  customField,
  onChange
}: CustomFieldArgs) {
  const [value, setValue] = useState<string | number>(
    customField?.value?.value?.raw
  )

  const config = customField?.custom_field
    ?.config as unknown as MonetaryConfigType
  const currency = config.currency

  const onLocalChange = (v: number | string) => {
    setValue(v)
    onChange({customField, value: v.toString()})
  }

  useEffect(() => {
    setValue(customField.value?.value?.raw)
  }, [customField.value?.value?.raw])

  return (
    <NumberInput
      label={customField.custom_field.name}
      decimalScale={2}
      fixedDecimalScale
      prefix={currency === "USD" ? "$" : ""} // Prefix for USD
      suffix={currency !== "USD" ? ` ${currency}` : ""} // Suffix for other currencies
      onChange={onLocalChange}
      value={value}
      hideControls
      min={0}
      styles={{
        input: {
          textAlign: "right" // Right-align numbers (common for monetary values)
        }
      }}
    />
  )
}
