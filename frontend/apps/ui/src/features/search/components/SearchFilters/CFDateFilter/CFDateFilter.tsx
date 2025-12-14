import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {OPERATOR_NUMERIC} from "@/features/search/microcomp/const"
import type {CustomFieldNumericOperator as CustomFieldNumericOperatorType} from "@/features/search/microcomp/types"
import {
  CustomFieldFilter,
  CustomFieldNumericOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Select, Text} from "@mantine/core"
import {DatePickerInput, type DateValue} from "@mantine/dates"
import {IconX} from "@tabler/icons-react"
import {format, parse} from "date-fns"
import SelectCustomField from "../SelectCustomField"
import styles from "./CFDateFilter.module.css"

interface Args {
  index: number
}

export default function CFDateFilter({index}: Args) {
  const dispatch = useAppDispatch()
  const {date_format: userDateFormat} = useAppSelector(selectMyPreferences)
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  const handleOperatorChange = (operator: CustomFieldNumericOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (value: DateValue) => {
    if (value) {
      // Convert to Date if it's a string, otherwise use as-is
      const date = typeof value === "string" ? new Date(value) : value

      // Store in YYYY-MM-DD format (ISO 8601) for backend
      const isoDateString = format(date, "yyyy-MM-dd")
      dispatch(updateFilter({index, updates: {value: isoDateString}}))
    } else {
      // Clear the value if date is null
      dispatch(updateFilter({index, updates: {value: undefined}}))
    }
  }

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  // Convert stored YYYY-MM-DD string back to Date for the picker
  const dateValue =
    filter.value && typeof filter.value === "string"
      ? parse(filter.value, "yyyy-MM-dd", new Date())
      : null

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>md:</Text>
        <SelectCustomField index={index} />
        <CFNumericOperator
          item={filter}
          onOperatorChange={handleOperatorChange}
        />
        <DatePickerInput
          value={dateValue}
          onChange={handleValueChange}
          onClick={e => e.stopPropagation()}
          size="sm"
          w="15ch"
          valueFormat={userDateFormat}
          placeholder={userDateFormat}
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
