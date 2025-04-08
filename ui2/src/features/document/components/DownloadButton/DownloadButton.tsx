import {useAppSelector} from "@/app/hooks"
import {download_file} from "@/httpClient"
import {ActionIcon, Menu, Skeleton, Text, Tooltip} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
import {useContext, useMemo} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {DocumentVersion} from "@/types"
import {useTranslation} from "react-i18next"

export default function DownloadButton() {
  const {t} = useTranslation()
  const mode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {
    currentData: doc,
    isFetching,
    isError,
    error
  } = useGetDocumentQuery(currentNodeID!)
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
    return <Text>{`${error}`}</Text>
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
