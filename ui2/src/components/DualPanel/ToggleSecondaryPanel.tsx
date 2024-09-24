import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ActionIcon} from "@mantine/core"
import {IconColumns2, IconX} from "@tabler/icons-react"
import {useContext} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {
  currentNodeChanged,
  secondaryPanelClosed,
  secondaryPanelOpened,
  selectCurrentNodeCType,
  selectCurrentNodeID,
  selectPanelComponent
} from "@/features/ui/uiSlice"

export default function ToggleSecondaryPanel() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const nodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const ctype = useAppSelector(s => selectCurrentNodeCType(s, mode))
  const secondaryPanel = useAppSelector(s =>
    selectPanelComponent(s, "secondary")
  )

  const onClick = () => {
    dispatch(secondaryPanelOpened(ctype == "folder" ? "commander" : "viewer"))
    dispatch(
      currentNodeChanged({id: nodeID!, ctype: ctype!, panel: "secondary"})
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
      onClick={() => dispatch(secondaryPanelClosed())}
      size="lg"
      variant="default"
    >
      <IconX size={18} />
    </ActionIcon>
  )
}
