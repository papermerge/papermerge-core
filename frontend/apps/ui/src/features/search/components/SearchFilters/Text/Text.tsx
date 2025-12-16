import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {CustomFieldNumericOperator as CustomFieldNumericOperatorType} from "@/features/search/microcomp/types"
import {
  CustomFieldFilter,
  CustomFieldNumericOperator
} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Select, Text, TextInput} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import styles from "../SearchFilters.module.css"
import SelectCustomField from "../SelectCustomField/SelectCustomField"

interface Args {
  index: number
}

export default function CFTextFilter({index}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CustomFieldFilter

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  const handleOperatorChange = (operator: CustomFieldNumericOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    dispatch(updateFilter({index, updates: {value}}))
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>md:</Text>
        <SelectCustomField index={index} />
        <Operator item={filter} onOperatorChange={handleOperatorChange} />
        <TextInput value={filter.value} onChange={handleValueChange} w="15ch" />
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

interface FilterTagOperatorArgs {
  item: CustomFieldFilter
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
}

function Operator({item, onOperatorChange}: FilterTagOperatorArgs) {
  const {t} = useTranslation()
  const OPTIONS = [
    {value: "eq", label: "="},
    {value: "ne", label: "!="},
    {value: "contains", label: t("Contains", {defaultValue: "Contains"})},
    {value: "matches", label: t("Matches", {defaultValue: "Matches"})}
  ]

  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      onOperatorChange(value as CustomFieldNumericOperatorType)
    }
  }

  return (
    <Select
      value={item.operator}
      w={"13ch"}
      data={OPTIONS}
      size="sm"
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
    />
  )
}
