import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {PanelMode} from "@/types"
import {ActionIcon} from "@mantine/core"
import {IconArrowBarLeft, IconArrowBarRight} from "@tabler/icons-react"
import {useContext} from "react"
import {useNavigate} from "react-router-dom"

import PanelContext from "@/contexts/PanelContext"
import {
  currentNodeChanged,
  selectCurrentNodeCType,
  selectCurrentNodeID,
  selectLastPageSize,
  selectPanelComponent
} from "@/features/ui/uiSlice"

export default function DuplicatePanelButton() {
  /* Make both panels show same content

  Panel is the component which abstract both <Viewer /> and <Commander />,
  in this sense panel show some node's content (either folder or document).
  Node is identified by unique ID.
  This component switches content (i.e. displayed node) in target panel to be the
  same as in source panel */
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const nodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const nodeIDMain = useAppSelector(s => selectCurrentNodeID(s, "main"))
  const nodeIDSecondary = useAppSelector(s =>
    selectCurrentNodeID(s, "secondary")
  )
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, "main"))
  const ctype = useAppSelector(s => selectCurrentNodeCType(s, mode))
  const secondaryPanel = useAppSelector(s =>
    selectPanelComponent(s, "secondary")
  )
  const navigate = useNavigate()
  const panelsHaveDifferentNodes = nodeIDMain != nodeIDSecondary

  const onClickDuplicateMain = () => {
    /* Duplicate content of the main panel into secondary i.e.
      source is "main panel"
      target is "secondary panel"
      and the operation is "target := source" */
    dispatch(
      currentNodeChanged({id: nodeID!, ctype: ctype!, panel: "secondary"})
    )
  }

  const onClickDuplicateSecondary = () => {
    /* Duplicate content of the secondary panel into main i.e.
      source is "secondary panel"
      target is "main panel"
      and the operation is "target := source"

      Current node in main panel should be switched via navigation.
      This way, when user refreshes browser, he/she will
      land on same node
    */
    if (ctype == "folder") {
      navigate(`/folder/${nodeID}?page_size=${lastPageSize}`)
    } else {
      navigate(`/document/${nodeID}`)
    }
  }

  if (mode == "main") {
    if (secondaryPanel && panelsHaveDifferentNodes) {
      /* Show <DuplicatePanelButton /> in main panel if and only if secondary panel
      is visible and panels show different nodes.
      In case both panels show same node - button won't do anything as
      panels already feature same content.  */
      return (
        <ActionIcon size="lg" onClick={onClickDuplicateMain} variant="default">
          <IconArrowBarRight size={18} />
        </ActionIcon>
      )
    }

    return <></>
  }

  if (panelsHaveDifferentNodes) {
    /* It does not make sense to display <DuplicatePanelButton /> when
    both panels ALREADY show same node */
    return (
      <ActionIcon
        size="lg"
        onClick={onClickDuplicateSecondary}
        variant="default"
      >
        <IconArrowBarLeft size={18} />
      </ActionIcon>
    )
  }
  /* Do not show at all. This happens when:
   1. secondary panel is not visible
   2. both panel's already show same node
  */
  return <></>
}
