import {ActionIcon, Box, Loader, Menu, Text, Tooltip} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
import type {ReactNode} from "react"
import type {DownloadDocumentVersion, I18NDownloadButtonText} from "./types"

interface Args {
  i18nIsReady?: boolean
  txt?: I18NDownloadButtonText
  versions?: DownloadDocumentVersion[] | null
  isLoading?: boolean // refers to the loading of the versions
  isError?: boolean
  onClick?: (documentVersionID: string) => void
}

export default function DownloadButton({
  i18nIsReady = false,
  isLoading = false,
  isError = false,
  txt,
  onClick,
  versions
}: Args) {
  const noVersions = !versions || versions.length == 0
  const icon = <IconDownload stroke={1.4} />

  if (!i18nIsReady) {
    return (
      <ActionIcon size="lg" variant="default">
        {icon}
      </ActionIcon>
    )
  }

  if (isLoading) {
    return (
      <DownloadMenu icon={icon} tooltip={txt?.loadingTooltip}>
        <Box p="md" mih={60} display="flex">
          <Loader size="md" />
        </Box>
      </DownloadMenu>
    )
  }

  if (isError) {
    return (
      <DownloadMenu
        icon={icon}
        tooltip={txt?.error || "Error: failed to load versions"}
      >
        <Text c="red">{txt?.error || "Error: failed to load versions"}</Text>
      </DownloadMenu>
    )
  }

  if (noVersions) {
    return (
      <DownloadMenu
        icon={icon}
        tooltip={txt?.emptyVersionsArrayError || "Error: no versions available"}
      >
        <Text c="red">
          {txt?.emptyVersionsArrayError || "Error: no versions available"}
        </Text>
      </DownloadMenu>
    )
  }

  const versionItems = versions.map(v => (
    <Menu.Item key={v.id} onClick={() => onClick?.(v.id)}>
      {`${txt?.versionLabel || "Version"} ${v.number}${v.shortDescription ? ` - ${v.shortDescription}` : ""}`}
    </Menu.Item>
  ))

  return (
    <DownloadMenu icon={icon} tooltip={txt?.downloadTooltip}>
      {versionItems}
    </DownloadMenu>
  )
}

interface DownloadMenuArgs {
  icon: ReactNode
  tooltip?: string
  children?: ReactNode
}

function DownloadMenu({icon, tooltip, children}: DownloadMenuArgs) {
  return (
    <Menu>
      <Menu.Target>
        <Tooltip label={tooltip} withArrow>
          <ActionIcon size="lg" variant="default">
            {icon}
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown p="sm">{children}</Menu.Dropdown>
    </Menu>
  )
}
