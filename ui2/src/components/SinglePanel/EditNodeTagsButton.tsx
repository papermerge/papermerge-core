//import {useContext} from "react"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTag} from "@tabler/icons-react"
/*
import {useSelector, useDispatch} from "react-redux"
import {selectCurrentFolderID, folderAdded} from "@/slices/dualPanel"
import create_new_folder from "@/components/modals/NewFolder"

import type {RootState} from "@/app/types"
*/
//import type {PanelMode} from "@/types"

//import PanelContext from "@/contexts/PanelContext"

export default function EditNodeTagsButton() {
  //const mode: PanelMode = useContext(PanelContext)
  /*
  const dispatch = useDispatch()
  const currentFolderId = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )
  */

  return (
    <Tooltip label="Edit tags" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={() => {}}>
        <IconTag stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
