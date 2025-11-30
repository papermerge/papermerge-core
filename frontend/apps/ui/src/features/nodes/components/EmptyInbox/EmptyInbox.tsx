import {Stack, Text} from "@mantine/core"
import {IconInbox} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import classes from "./EmptyInbox.module.css"

export function EmptyInbox() {
  const {t} = useTranslation()

  return (
    <Stack
      className={classes.container}
      align="center"
      justify="center"
      gap="md"
    >
      <IconInbox size={48} className={classes.icon} stroke={1.5} />
      <Text className={classes.message}>
        {t("nodes.emptyState.inbox", {defaultValue: "Your inbox is empty"})}
      </Text>
    </Stack>
  )
}
