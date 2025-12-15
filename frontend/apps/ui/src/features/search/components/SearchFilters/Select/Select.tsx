import {useAppDispatch, useAppSelector} from "@/app/hooks"

import type {SelectOperator} from "@/features/search/microcomp/types"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Select, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import SelectCustomField from "../SelectCustomField"
import {useSelectCustomField} from "../SelectCustomField/useSelectCustomField"
import styles from "./Select.module.css"
import type {SelectConfig} from "./types"

interface Args {
  index: number
}

export default function CustomFieldSelectFilter({index}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter
  const config = filter.config as SelectConfig
  const options = config.options
  const data = options.map(o => {
    return {label: o.label, value: o.value}
  })
  const {value: cfNameValue} = useSelectCustomField(index)

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(removeFilter(index))
  }

  const handleOperatorChange = (operator: SelectOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (value: string | null) => {
    const theValue = value ?? undefined
    dispatch(updateFilter({index, updates: {value: theValue}}))
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
      {cfNameValue && (
        <Select data={data} onChange={handleValueChange} clearable />
      )}
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
  onOperatorChange?: (operator: SelectOperator) => void
}

function OperatorSelect({item, onOperatorChange}: OperatorSelectArgs) {
  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      onOperatorChange(value as SelectOperator)
    }
  }

  return (
    <Select
      value={item.operator}
      w={"12ch"}
      data={OPERATOR_SELECT}
      size="sm"
      onChange={handleChange}
    />
  )
}

const OPERATOR_SELECT = [
  {value: "=", label: "="},
  {value: "!=", label: "!="},
  {value: "emp", label: "Empty"},
  {value: "nemp", label: "Not Empty"}
]
