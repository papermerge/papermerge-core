import {ActionIcon} from "@mantine/core"
import {IconFolderPlus} from "@tabler/icons-react"
import {useSelector, useDispatch} from "react-redux"
import {selectCurrentFolderID, folderAdded} from "@/slices/dualPanel"
import create_new_folder from "@/components/modals/NewFolder"

import type {RootState} from "@/app/types"
import type {NodeType, PanelMode} from "@/types"

type Args = {
  mode: PanelMode
}

export default function NewFolderButton({mode}: Args) {
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
    <ActionIcon onClick={onNewFolder} size="lg" variant="default">
      <IconFolderPlus size={18} />
    </ActionIcon>
  )
}
