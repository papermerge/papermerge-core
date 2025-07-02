import {ActionIcon, Box, Loader, Menu, Text, Tooltip} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
import type {ReactNode} from "react"
import classes from "./DownloadButton.module.css"
import type {DownloadDocumentVersion, I18NDownloadButtonText} from "./types"

interface Args {
  i18nIsReady?: boolean
  txt?: I18NDownloadButtonText
  versions?: DownloadDocumentVersion[] | null
  isLoading?: boolean // refers to the loading of the versions
  isError?: boolean
  onClick?: (documentVersionID: string) => void
  onOpen?: () => void
  onClose?: () => void
}

export default function DownloadButton({
  i18nIsReady = false,
  isLoading = false,
  isError = false,
  txt,
  onClick,
  onOpen,
  onClose,
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
      <DownloadMenu
        icon={icon}
        tooltip={txt?.loadingTooltip || "Is loading..."}
        onOpen={onOpen}
        onClose={onClose}
      >
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
        onOpen={onOpen}
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
        onOpen={onOpen}
        onClose={onClose}
        tooltip={txt?.downloadTooltip || "Download document version"}
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
    <DownloadMenu
      icon={icon}
      tooltip={txt?.downloadTooltip || "Download document version"}
      onOpen={onOpen}
      onClose={onClose}
    >
      {versionItems}
    </DownloadMenu>
  )
}

interface DownloadMenuArgs {
  icon: ReactNode
  tooltip?: string
  children?: ReactNode
  onOpen?: () => void
  onClose?: () => void
}

function DownloadMenu({
  icon,
  tooltip,
  onOpen,
  onClose,
  children
}: DownloadMenuArgs) {
  return (
    <Menu onOpen={onOpen} onClose={onClose}>
      <Menu.Target>
        <Tooltip label={tooltip} withArrow>
          <ActionIcon size="lg" variant="default">
            {icon}
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown p="sm" className={classes.menuDropdown}>
        {children}
      </Menu.Dropdown>
    </Menu>
  )
}
