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
import {format, parse} from "date-fns"
import styles from "../SearchFilters.module.css"

interface Args {
  index: number
  filterName: string
}

export default function CreatedAtFilterComponent({index, filterName}: Args) {
  const dispatch = useAppDispatch()
  const {timestamp_format: datetimeFormat} = useAppSelector(selectMyPreferences)

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

      // Store in ISO 8601 datetime format for backend
      const isoDateTimeString = format(date, "yyyy-MM-dd'T'HH:mm:ss")
      dispatch(updateFilter({index, updates: {value: isoDateTimeString}}))
    } else {
      dispatch(updateFilter({index, updates: {value: undefined}}))
    }
  }

  // Convert stored datetime string back to Date for the picker
  const dateValue =
    filter.value && typeof filter.value === "string"
      ? parse(filter.value, "yyyy-MM-dd'T'HH:mm:ss", new Date())
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
