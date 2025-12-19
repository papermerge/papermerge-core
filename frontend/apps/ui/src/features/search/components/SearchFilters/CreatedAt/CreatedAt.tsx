import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {OPERATOR_NUMERIC} from "@/features/search/microcomp/const"
import type {
  CreatedAtFilter,
  CustomFieldNumericOperator as CustomFieldNumericOperatorType,
  NumericOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Select, Text} from "@mantine/core"
import {DateTimePicker, type DateValue} from "@mantine/dates"
import {IconX} from "@tabler/icons-react"
import {fromZonedTime, toZonedTime} from "date-fns-tz"
import styles from "../SearchFilters.module.css"

interface Args {
  index: number
  filterName: string
}

export default function CreatedAtFilterComponent({index, filterName}: Args) {
  const dispatch = useAppDispatch()
  const {timestamp_format: datetimeFormat, timezone} =
    useAppSelector(selectMyPreferences)

  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CreatedAtFilter

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  const handleOperatorChange = (operator: NumericOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (value: DateValue) => {
    if (value) {
      const date = typeof value === "string" ? new Date(value) : value

      // User picked a local time - convert to UTC for storage
      // fromZonedTime: "this date/time in user's timezone" -> UTC Date
      const utcDate = fromZonedTime(date, timezone)

      // Store as ISO 8601 UTC string with Z suffix
      const isoUtcString = utcDate.toISOString()
      dispatch(updateFilter({index, updates: {value: isoUtcString}}))
    } else {
      dispatch(updateFilter({index, updates: {value: undefined}}))
    }
  }

  // Convert stored UTC datetime string back to user's local time for the picker
  const dateValue =
    filter.value && typeof filter.value === "string"
      ? toZonedTime(new Date(filter.value), timezone)
      : null

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>{filterName}:</Text>
        <Operator item={filter} onOperatorChange={handleOperatorChange} />
        <DateTimePicker
          value={dateValue}
          onChange={handleValueChange}
          onClick={e => e.stopPropagation()}
          size="sm"
          w="22ch"
          valueFormat={datetimeFormat}
          placeholder={datetimeFormat}
          withSeconds
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
interface OperatorArgs {
  item: CreatedAtFilter
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
}

function Operator({item, onOperatorChange}: OperatorArgs) {
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
      onClick={e => e.stopPropagation()}
    />
  )
}
