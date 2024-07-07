import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectSelectedNodeIds} from "@/slices/dualPanel"

import type {RootState} from "@/app/types"
import type {PanelMode} from "@/types"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import DeleteButton from "@/components/Commander/DeleteButton"
import NewFolderButton from "@/components/Commander/NewFolderButton"
import UploadButton from "@/components/Commander/UploadButton"

type Args = {
  mode: PanelMode
}

export default function FolderNodeActions({mode}: Args) {
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  ) as Array<string>

  return (
    <Group justify="space-between">
      <Group>
        <UploadButton />
        <NewFolderButton mode={mode} />
        {selectedIds.length > 0 && <DeleteButton />}
      </Group>
      <Group>
        <ToggleSecondaryPanel mode={mode} />
      </Group>
    </Group>
  )
}
