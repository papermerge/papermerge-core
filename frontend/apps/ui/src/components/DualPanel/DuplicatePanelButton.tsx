import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectCurrentNodeID,
  selectPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import {ActionIcon} from "@mantine/core"
import {IconArrowBarLeft, IconArrowBarRight} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectLastPageSize} from "@/features/ui/uiSlice"

export default function DuplicatePanelButton() {
  /* Make both panels show same content

  Panel is the component which abstract both <Viewer /> and <Commander />,
  in this sense panel show some node's content (either folder or document).
  Node is identified by unique ID.
  This component switches content (i.e. displayed node) in target panel to be the
  same as in source panel */
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const nodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const nodeIDMain = useAppSelector(s => selectCurrentNodeID(s, "main"))
  const nodeIDSecondary = useAppSelector(s =>
    selectCurrentNodeID(s, "secondary")
  )
  const lastPageSize = useAppSelector(s => selectLastPageSize(s, "main"))
  const component = useAppSelector(s => selectPanelComponent(s, panelId))
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
      updatePanelCurrentNode({
        entityID: nodeID!,
        component: component!,
        panelID: "secondary"
      })
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
    if (component == "commander") {
      navigate(`/folder/${nodeID}?page_size=${lastPageSize}`)
    } else if (component == "viewer") {
      navigate(`/document/${nodeID}`)
    }
  }

  if (panelId == "main") {
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
