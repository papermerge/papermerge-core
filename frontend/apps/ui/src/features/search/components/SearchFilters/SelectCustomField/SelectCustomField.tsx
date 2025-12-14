// SelectCustomField.tsx
import {Select} from "@mantine/core"
import {useSelectCustomField} from "./useSelectCustomField"

interface Props {
  index: number
}

export default function SelectCustomField({index}: Props) {
  const {value, selectData, onChange} = useSelectCustomField(index)

  return (
    <Select
      value={value}
      data={selectData}
      size="sm"
      onChange={onChange}
      onClick={e => e.stopPropagation()}
      searchable
      clearable
    />
  )
}
