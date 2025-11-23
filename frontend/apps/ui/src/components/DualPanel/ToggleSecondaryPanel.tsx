import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {closePanelAction} from "@/features/ui/panelActions"
import {
  selectCurrentComponentState,
  selectCurrentNodeID,
  selectPanelComponent,
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import {ActionIcon} from "@mantine/core"
import {IconColumns2, IconX} from "@tabler/icons-react"

import {selectCurrentUser} from "@/slices/currentUser"

export default function ToggleSecondaryPanel() {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const nodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const component = useAppSelector(s => selectPanelComponent(s, panelId))
  const secondaryPanel = useAppSelector(s =>
    selectCurrentComponentState(s, "secondary")
  )

  const onOpenSecondaryPanel = () => {
    dispatch(
      setPanelComponent({
        panelId: "secondary",
        component: component
      })
    )
    dispatch(
      updatePanelCurrentNode({
        panelID: "secondary",
        component: component!,
        entityID: nodeID!
      })
    )
  }

  if (panelId == "main") {
    /* Display button for splitting the panel if and only if there
      is no secondary panel opened */
    if (!secondaryPanel) {
      return (
        <ActionIcon size="lg" onClick={onOpenSecondaryPanel} variant="default">
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
