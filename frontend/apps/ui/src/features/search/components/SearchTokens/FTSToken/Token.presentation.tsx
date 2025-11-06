import {FreeTextToken} from "@/features/search/microcomp/types"
import {ActionIcon, Box} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "./Token.module.css"

interface Args {
  item: FreeTextToken
  onRemove?: () => void
}

export default function FTSTokenPresentation({item, onRemove}: Args) {
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
