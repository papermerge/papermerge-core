import {ActionIcon, Tooltip} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
import type {I18NDownloadButtonText} from "./types"

interface Args {
  i18nIsReady: boolean
  txt?: I18NDownloadButtonText
}

export default function DownloadButton({i18nIsReady, txt}: Args) {
  if (!i18nIsReady) {
    return (
      <ActionIcon size={"lg"} variant="default">
        <IconDownload stroke={1.4} />
      </ActionIcon>
    )
  }

  return (
    <Tooltip label={txt?.downloadLabel} withArrow>
      <ActionIcon size={"lg"} variant="default">
        <IconDownload stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
