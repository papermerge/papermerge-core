import {Stack, Text} from "@mantine/core"
import {IconFolder} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import classes from "./EmptyHome.module.css"

export function EmptyHome() {
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
        {t("nodes.emptyState.home", {
          defaultValue: "Your home folder is empty"
        })}
      </Text>
    </Stack>
  )
}
