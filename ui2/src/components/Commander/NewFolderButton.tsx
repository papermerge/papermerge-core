import {useContext} from "react"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconFolderPlus} from "@tabler/icons-react"
import {useSelector, useDispatch} from "react-redux"
import {selectCurrentFolderID, folderAdded} from "@/slices/dualPanel/dualPanel"
import create_new_folder from "@/components/modals/NewFolder"

import type {RootState} from "@/app/types"
import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

export default function NewFolderButton() {
  const mode: PanelMode = useContext(PanelContext)
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
    <Tooltip label="New Folder" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onNewFolder}>
        <IconFolderPlus stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
