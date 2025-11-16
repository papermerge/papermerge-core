import {FreeTextFilter} from "@/features/search/microcomp/types"
import {ActionIcon, Box} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "./Filter.module.css"

interface Args {
  item: FreeTextFilter
  onRemove?: () => void
}

export default function FTSFilterPresentation({item, onRemove}: Args) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      {item.value}
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
