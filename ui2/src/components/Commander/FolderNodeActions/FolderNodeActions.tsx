import {useContext} from "react"
import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectSelectedNodeIds} from "@/slices/dualPanel/dualPanel"

import type {RootState} from "@/app/types"
import type {PanelMode} from "@/types"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import DeleteButton from "@/components/Commander/DeleteButton"
import NewFolderButton from "@/components/Commander/NewFolderButton"
import UploadButton from "@/components/Commander/UploadButton"

import PanelContext from "@/contexts/PanelContext"
import EditNodeTagsButton from "@/components/SinglePanel/EditNodeTagsButton"
import EditNodeTitleButton from "@/components/SinglePanel/EditNodeTitleButton"

export default function FolderNodeActions() {
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  ) as Array<string>

  return (
    <Group justify="space-between">
      <Group>
        {selectedIds.length == 0 && <UploadButton />}
        {selectedIds.length == 0 && <NewFolderButton />}
        {selectedIds.length == 1 && <EditNodeTitleButton />}
        {selectedIds.length == 1 && <EditNodeTagsButton />}
        {selectedIds.length > 0 && <DeleteButton />}
      </Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
