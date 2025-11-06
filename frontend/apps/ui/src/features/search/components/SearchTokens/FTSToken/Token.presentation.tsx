import {FreeTextToken} from "@/features/search/microcomp/types"
import {Box} from "@mantine/core"
import styles from "./Token.module.css"

interface Args {
  item: FreeTextToken
}

export default function FTSTokenPresentation({item}: Args) {
  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      {item.value}
    </Box>
  )
}
