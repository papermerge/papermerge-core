import {Group, NumberInput} from "@mantine/core"
import {useCallback, useEffect, useMemo, useState} from "react"
import {SaveStatusIndicator} from "./SaveStatusIndicator"
import type {MonetaryConfig, MonetaryFieldProps} from "./types"
import {useAutoSaveCustomField} from "./useAutoSaveCustomField"

/**
 * Monetary custom field input with auto-save
 */
export function MonetaryField({
  customField,
  documentId,
  disabled = false
}: MonetaryFieldProps) {
  const rawValue = customField?.value?.value?.raw
  const initialValue =
    rawValue !== undefined && rawValue !== null ? Number(rawValue) : ""

  const [value, setValue] = useState<string | number>(initialValue)

  const {save, saveStatus, error} = useAutoSaveCustomField({
    documentId,
    fieldId: customField.custom_field.id
  })

  const label = customField?.custom_field?.name ?? ""

  // Extract currency from config
  const config = useMemo(() => {
    return (
      (customField?.custom_field?.config as unknown as MonetaryConfig) ?? {
        currency: "EUR"
      }
    )
  }, [customField?.custom_field?.config])

  const currency = config.currency ?? "EUR"

  // Sync with external value changes
  useEffect(() => {
    const newRaw = customField?.value?.value?.raw
    const newValue =
      newRaw !== undefined && newRaw !== null ? Number(newRaw) : ""
    setValue(newValue)
  }, [customField?.value?.value?.raw])

  const handleChange = useCallback(
    (newValue: string | number) => {
      setValue(newValue)
      // Convert to string for backend - MonetaryTypeHandler handles conversion
      save(newValue === "" ? "" : String(newValue))
    },
    [save]
  )

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      <NumberInput
        style={{flex: 1}}
        label={label}
        decimalScale={2}
        fixedDecimalScale
        prefix={currency === "USD" ? "$" : ""}
        suffix={currency !== "USD" ? ` ${currency}` : ""}
        onChange={handleChange}
        value={value}
        hideControls
        min={0}
        disabled={disabled}
        styles={{
          input: {
            textAlign: "right"
          }
        }}
      />
      <SaveStatusIndicator status={saveStatus} error={error} />
    </Group>
  )
}

export default MonetaryField
