import {download_file} from "@/httpClient"
import {ActionIcon, Menu, Skeleton, Tooltip} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
import {useMemo} from "react"

import {DocumentType, DocumentVersion} from "@/types"
import {useTranslation} from "react-i18next"

interface Args {
  doc?: DocumentType
  isFetching: boolean
  isError: boolean
}

export default function DownloadButton({doc, isFetching, isError}: Args) {
  const {t} = useTranslation()
  const versionComponents = useMemo(() => {
    return doc?.versions?.map(v => {
      if (v.short_description) {
        return (
          <Menu.Item key={v.id} onClick={() => onClick(v)}>
            Version {v.number} - {v.short_description}
          </Menu.Item>
        )
      }
      return (
        <Menu.Item key={v.id} onClick={() => onClick(v)}>
          Version {v.number}
        </Menu.Item>
      )
    })
  }, [doc?.versions.length])

  const onClick = (v: DocumentVersion) => {
    download_file(v)
  }

  if (isFetching) {
    return <ActionButtonSkeleton />
  }

  if (isError) {
    return (
      <ActionIcon size={"lg"} variant="default" color={"red"}>
        <IconDownload stroke={1.4} />
      </ActionIcon>
    )
  }

  return (
    <Menu>
      <Menu.Target>
        <Tooltip label={t("common.download")} withArrow>
          <ActionIcon size={"lg"} variant="default">
            <IconDownload stroke={1.4} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>{versionComponents}</Menu.Dropdown>
    </Menu>
  )
}

function ActionButtonSkeleton() {
  const {t} = useTranslation()
  return (
    <div>
      <Skeleton>
        <Menu>
          <Menu.Target>
            <Tooltip label={t("common.download")} withArrow>
              <ActionIcon size={"lg"} variant="default">
                <IconDownload stroke={1.4} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
        </Menu>
      </Skeleton>
    </div>
  )
}
