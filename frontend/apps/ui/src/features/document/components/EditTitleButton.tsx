import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {useTranslation} from "react-i18next"

interface Args {
  onClick: () => void
}

export default function EditTitleButton({onClick}: Args) {
  const {t} = useTranslation()

  return (
    <Box>
      <Tooltip label={t("common.change_title")} withArrow>
        <ActionIcon size={"lg"} variant="default" onClick={onClick}>
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Tooltip>
    </Box>
  )
}
