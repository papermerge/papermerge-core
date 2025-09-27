import {getCustomFieldTypes} from "@/features/custom-fields/utils"
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
  const data: ComboboxItem[] = getCustomFieldTypes(t)

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
