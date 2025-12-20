import {useAppDispatch, useAppSelector} from "@/app/hooks"

import OwnerSelect from "@/components/OwnerSelect"
import type {SelectOperator} from "@/features/search/microcomp/types"
import {OwnerFilter} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import type {Owner} from "@/types"
import {ActionIcon, Box, Group, Select, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "../SearchFilters.module.css"

interface Args {
  index: number
}

export default function OwnerFilterComponent({index}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as OwnerFilter

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(removeFilter(index))
  }

  const handleOperatorChange = (operator: SelectOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValueChange = (value: Owner) => {
    const theValue = value ?? undefined
    dispatch(updateFilter({index, updates: {value: theValue}}))
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"green"}>Owner:</Text>
      </Group>
      <OperatorSelect item={filter} onOperatorChange={handleOperatorChange} />
      <OwnerSelect
        onChange={handleValueChange}
        value={filter.value ?? null}
        withLabel={false}
      />
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
  item: OwnerFilter
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
      value={item.operator || "="}
      w={"8ch"}
      data={OPERATOR_SELECT}
      size="sm"
      onChange={handleChange}
    />
  )
}

const OPERATOR_SELECT = [
  {value: "=", label: "="},
  {value: "!=", label: "!="}
]
