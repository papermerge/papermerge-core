import {ActionIcon, Loader, Menu, Tooltip} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
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

  if (!i18nIsReady) {
    return (
      <ActionIcon size={"lg"} variant="default">
        <IconDownload stroke={1.4} />
      </ActionIcon>
    )
  }

  if (isLoading) {
    return (
      <Menu>
        <Menu.Target>
          <Tooltip label={txt?.loadingTooltip} withArrow>
            <ActionIcon size={"lg"} variant="default">
              <IconDownload stroke={1.4} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          <Loader />
        </Menu.Dropdown>
      </Menu>
    )
  }

  if (isError) {
    return (
      <Menu>
        <Menu.Target>
          <Tooltip label={txt?.downloadTooltip} withArrow>
            <ActionIcon size={"lg"} variant="default">
              <IconDownload stroke={1.4} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>{txt?.error}</Menu.Dropdown>
      </Menu>
    )
  }

  if (noVersions) {
    return (
      <Menu>
        <Menu.Target>
          <Tooltip label={txt?.downloadTooltip} withArrow>
            <ActionIcon size={"lg"} variant="default">
              <IconDownload stroke={1.4} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>{txt?.emptyVersionsArrayError}</Menu.Dropdown>
      </Menu>
    )
  }

  const versComponents = versions.map(v => {
    let onClickHandler
    if (onClick) {
      onClickHandler = () => onClick(v.id)
    }

    if (v.shortDescription) {
      return (
        <Menu.Item key={v.id} onClick={onClickHandler}>
          Version {v.number} - {v.shortDescription}
        </Menu.Item>
      )
    }
    return (
      <Menu.Item key={v.id} onClick={onClickHandler}>
        Version {v.number}
      </Menu.Item>
    )
  })

  return (
    <Menu>
      <Menu.Target>
        <Tooltip label={txt?.downloadTooltip} withArrow>
          <ActionIcon size={"lg"} variant="default">
            <IconDownload stroke={1.4} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>{versComponents}</Menu.Dropdown>
    </Menu>
  )
}
