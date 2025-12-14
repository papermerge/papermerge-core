import {useAppDispatch} from "@/app/hooks"
import {removeFilter} from "@/features/search/storage/search"
import {ActionIcon, Box, Group, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import SelectCustomField from "../SelectCustomField"
import styles from "./CFSelectTypeHandler.module.css"

interface Args {
  index: number
}

export default function CFSelectTypeHandler({index}: Args) {
  const dispatch = useAppDispatch()

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(removeFilter(index))
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"green"}>md:</Text>
        <SelectCustomField index={index} />
      </Group>
      <ActionIcon
        size="xs"
        className={styles.removeButton}
        onClick={handleRemoveClick}
        aria-label="Remove token"
      >
        <IconX size={10} stroke={3} />
      </ActionIcon>
    </Box>
  )
}
