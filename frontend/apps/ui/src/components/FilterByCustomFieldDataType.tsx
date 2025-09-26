import {ComboboxItem, MultiSelect, Paper} from "@mantine/core"
import {TFunction} from "i18next"

interface Args {
  selectedDataTypes?: string[]
  onChange?: (value: string[] | null) => void
  label: string
  t?: TFunction
}

export default function FilterByCustomFieldDataType({
  selectedDataTypes,
  onChange,
  t,
  label
}: Args) {
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

  return (
    <Paper
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <MultiSelect
        label={label}
        value={selectedDataTypes}
        data={data}
        onChange={onChange}
        searchable
        clearable
      />
    </Paper>
  )
}
