import {ComboboxItem} from "@mantine/core"
import {TFunction} from "i18next"

export function getCustomFieldTypes(t?: TFunction): ComboboxItem[] {
  const data: ComboboxItem[] = [
    {
      value: "date",
      label: t?.("customFieldType.date.label", {defaultValue: "Date"}) || "Date"
    },
    {
      value: "text",
      label: t?.("customFieldType.text", {defaultValue: "Text"}) || "Text"
    },
    {
      value: "boolean",
      label:
        t?.("customFieldType.boolean", {defaultValue: "Yes/No"}) || "Yes/No"
    },
    {
      value: "int",
      label: t?.("customFieldType.int", {defaultValue: "Integer"}) || "Integer"
    },
    {
      value: "float",
      label:
        t?.("customFieldType.float", {defaultValue: "Decimal"}) || "Decimal"
    },
    {
      value: "monetary",
      label:
        t?.("customFieldType.monetary", {defaultValue: "Currency"}) ||
        "Currency"
    },
    {
      value: "yearmonth",
      label:
        t?.("customFieldType.yearmonth", {defaultValue: "Year/Month"}) ||
        "Year/Month"
    }
  ]

  return data
}
