import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {OPERATOR_NUMERIC} from "@/features/search/microcomp/const"
import type {CustomFieldNumericOperator as CustomFieldNumericOperatorType} from "@/features/search/microcomp/types"
import {
  CustomFieldFilter,
  CustomFieldNumericOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Select, Text} from "@mantine/core"
import {DatePickerInput} from "@mantine/dates"
import {IconX} from "@tabler/icons-react"
import SelectCustomField from "../SelectCustomField"
import styles from "./CFDateFilter.module.css"

interface Args {
  index: number
}

export default function CFDateFilter({index}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  const handleOperatorChange = (operator: CustomFieldNumericOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (value: string | number) => {
    const num = parseInt(value as string)
    dispatch(updateFilter({index, updates: {value: num}}))
  }

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>cf:</Text>
        <SelectCustomField index={index} />
        <CFNumericOperator
          item={filter}
          onOperatorChange={handleOperatorChange}
        />
        <DatePickerInput
          onClick={e => e.stopPropagation()}
          size="sm"
          w="15ch"
        />
      </Group>
      <ActionIcon
        size="xs"
        className={styles.removeButton}
        onClick={handleRemove}
        aria-label="Remove token"
      >
        <IconX size={10} stroke={3} />
      </ActionIcon>
    </Box>
  )
}

interface CFNumericOperatorArgs {
  item: CustomFieldFilter
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
}

function CFNumericOperator({item, onOperatorChange}: CFNumericOperatorArgs) {
  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      onOperatorChange(value as CustomFieldNumericOperatorType)
    }
  }

  return (
    <Select
      value={item.operator}
      w={"8ch"}
      data={OPERATOR_NUMERIC}
      size="sm"
      onChange={handleChange}
    />
  )
}
