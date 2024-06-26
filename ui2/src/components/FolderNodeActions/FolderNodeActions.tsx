import {Group, Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import {useSelector, useDispatch} from "react-redux"
import {selectCurrentFolderID, folderAdded} from "@/slices/dualPanel"
import create_new_folder from "@/components/modals/NewFolder"

import type {RootState} from "@/app/types"
import type {NodeType, PanelMode} from "@/types"
import ToggleSecondaryPanel from "../DualPanel/ToggleSecondaryPanel"

type Args = {
  mode: PanelMode
}

export default function FolderNodeActions({mode}: Args) {
  const dispatch = useDispatch()
  const currentFolderId = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )

  const onNewFolder = () => {
    if (!currentFolderId) {
      console.error("Error: no current folder found")
      return
    }
    create_new_folder(currentFolderId).then((new_folder: NodeType) => {
      dispatch(folderAdded({node: new_folder, mode: mode}))
    })
  }

  return (
    <Group justify="center">
      <Button
        leftSection={<IconPlus size={14} />}
        onClick={onNewFolder}
        variant="default"
      >
        New Folder
      </Button>
      <ToggleSecondaryPanel mode={mode} />
    </Group>
  )
}
