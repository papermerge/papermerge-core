import {useAppDispatch, useAppSelector} from "@/app/hooks"

import type {MultiSelectOperator} from "@/features/search/microcomp/types"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, MultiSelect, Select, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import SelectCustomField from "../SelectCustomField"
import {useSelectCustomField} from "../SelectCustomField/useSelectCustomField"
import styles from "./MultiSelect.module.css"
import {MultiSelectConfig} from "./types"

interface Args {
  index: number
}

export default function CustomFieldMultiSelectFilter({index}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter
  const config = filter.config as MultiSelectConfig
  const options = config.options
  const data = options.map(o => {
    return {label: o.label, value: o.value}
  })
  const {value: cfNameValue} = useSelectCustomField(index)

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(removeFilter(index))
  }

  const handleOperatorChange = (operator: MultiSelectOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (values: string[]) => {
    dispatch(updateFilter({index, updates: {values}}))
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"green"}>md:</Text>
        <SelectCustomField index={index} />
      </Group>
      {cfNameValue && (
        <OperatorSelect item={filter} onOperatorChange={handleOperatorChange} />
      )}
      {cfNameValue && <MultiSelect data={data} onChange={handleValueChange} />}
      <ActionIcon
        size="xs"
        className={styles.removeButton}
        onClick={handleRemoveClick}
      >
        <IconX size={10} stroke={3} />
      </ActionIcon>
    </Box>
  )
}

interface OperatorSelectArgs {
  item: CustomFieldFilter
  onOperatorChange?: (operator: MultiSelectOperator) => void
}

function OperatorSelect({item, onOperatorChange}: OperatorSelectArgs) {
  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      onOperatorChange(value as MultiSelectOperator)
    }
  }

  return (
    <Select
      value={item.operator}
      w={"12ch"}
      data={OPERATOR_MULTISELECT}
      size="sm"
      onChange={handleChange}
    />
  )
}

const OPERATOR_MULTISELECT = [
  {value: "all", label: "All"},
  {value: "any", label: "Any"},
  {value: "not", label: "Not"}
]
