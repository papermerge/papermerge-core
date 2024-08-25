import {useContext} from "react"
import {useSelector} from "react-redux"
import {Menu, Tooltip, ActionIcon} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"
import {selectDocumentVersions} from "@/slices/dualPanel/dualPanel"
import {RootState} from "@/app/types"
import {download_file} from "@/httpClient"

import PanelContext from "@/contexts/PanelContext"
import {DocumentVersionWithPageRot} from "@/types"

export default function DownloadButton() {
  const mode = useContext(PanelContext)

  const vers = useSelector((state: RootState) =>
    selectDocumentVersions(state, mode)
  )

  const onClick = (v: DocumentVersionWithPageRot) => {
    download_file(v)
  }

  const versionComponents = vers?.map(v => {
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

  return (
    <Menu>
      <Menu.Target>
        <Tooltip label="Download" withArrow>
          <ActionIcon size={"lg"} variant="default">
            <IconDownload stroke={1.4} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>{versionComponents}</Menu.Dropdown>
    </Menu>
  )
}
