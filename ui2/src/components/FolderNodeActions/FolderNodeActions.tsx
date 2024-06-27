import {Group, ActionIcon, FileButton} from "@mantine/core"
import {IconFolderPlus, IconUpload} from "@tabler/icons-react"
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

  const onUpload = () => {}

  return (
    <Group justify="space-between">
      <Group>
        <FileButton onChange={onUpload} multiple>
          {props => (
            <ActionIcon {...props} size="lg" variant="default">
              <IconUpload size={18} />
            </ActionIcon>
          )}
        </FileButton>

        <ActionIcon onClick={onNewFolder} size="lg" variant="default">
          <IconFolderPlus size={18} />
        </ActionIcon>
      </Group>
      <Group>
        <ToggleSecondaryPanel mode={mode} />
      </Group>
    </Group>
  )
}
