import {Stack, Text} from "@mantine/core"
import {IconFolder} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import classes from "./EmptyFolder.module.css"

export function EmptyFolder() {
  const {t} = useTranslation()

  return (
    <Stack
      className={classes.container}
      align="center"
      justify="center"
      gap="md"
    >
      <IconFolder size={48} className={classes.icon} stroke={1.5} />
      <Text className={classes.message}>
        {t("nodes.emptyState.folder", {
          defaultValue: "Folder is empty"
        })}
      </Text>
    </Stack>
  )
}
