import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {CreatedByFilter} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "../SearchFilters.module.css"

import UserSelect from "./UserSelect"

interface Args {
  index: number
  filterName: string
}

export default function CreatedByFilterComponent({index, filterName}: Args) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as CreatedByFilter

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  const handleValueChange = (value: string | null) => {
    if (value) {
      dispatch(updateFilter({index, updates: {value}}))
    }
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>{filterName}:</Text>
        <UserSelect value={filter.value} onChange={handleValueChange} />
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
