import {useContext} from "react"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"
/*
import {useSelector, useDispatch} from "react-redux"
import {selectCurrentFolderID, folderAdded} from "@/slices/dualPanel"
import create_new_folder from "@/components/modals/NewFolder"

import type {RootState} from "@/app/types"
*/
import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

export default function EditNodeTitleButton() {
  const mode: PanelMode = useContext(PanelContext)
  /*
  const dispatch = useDispatch()
  const currentFolderId = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )
  */

  return (
    <Tooltip label="Change title" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={() => {}}>
        <IconEdit stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
