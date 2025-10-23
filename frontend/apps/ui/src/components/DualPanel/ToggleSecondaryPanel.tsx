import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ActionIcon} from "@mantine/core"
import {IconColumns2, IconX} from "@tabler/icons-react"
import {closePanelAction} from "@/features/ui/panelActions"
import {
  setPanelComponent,
  selectCurrentComponentState
} from "@/features/ui/panelRegistry"
import {useContext} from "react"

import type {CType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {
  currentNodeChanged,
  selectCurrentNodeCType,
  selectCurrentNodeID
} from "@/features/ui/uiSlice"
import {selectCurrentUser} from "@/slices/currentUser"

export default function ToggleSecondaryPanel() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const nodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const ctype = useAppSelector(s => selectCurrentNodeCType(s, mode))
  const secondaryPanel = useAppSelector(s =>
    selectCurrentComponentState(s, "secondary")
  )

  const onClick = () => {
    let currentNodeID = nodeID
    let currentCType: CType | undefined = ctype
    if (!nodeID) {
      currentNodeID = user.home_folder_id
      currentCType = "folder"
    }
    dispatch(
      setPanelComponent({
        panelId: "secondary",
        component: ctype == "folder" ? "commander" : "viewer"
      })
    )
    dispatch(
      currentNodeChanged({
        id: currentNodeID!,
        ctype: currentCType!,
        panel: "secondary"
      })
    )
  }

  if (mode == "main") {
    /* Display button for splitting the panel if and only if there
      is no secondary panel opened */
    if (!secondaryPanel) {
      return (
        <ActionIcon size="lg" onClick={onClick} variant="default">
          <IconColumns2 size={18} />
        </ActionIcon>
      )
    }

    return <></>
  }

  return (
    <ActionIcon
      onClick={() => dispatch(closePanelAction("secondary"))}
      size="lg"
      variant="default"
    >
      <IconX size={18} />
    </ActionIcon>
  )
}
