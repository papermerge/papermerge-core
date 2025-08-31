import {useAppDispatch} from "@/app/hooks"
import {ActionIcon} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import {useContext} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {secondaryPanelAuditLogDetailsUpdated} from "@/features/ui/uiSlice"

export default function CloseSecondaryPanel() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()

  if (mode == "main") {
    return <></>
  }

  return (
    <ActionIcon
      onClick={() => dispatch(secondaryPanelAuditLogDetailsUpdated(undefined))}
      size="lg"
      variant="default"
    >
      <IconX size={18} />
    </ActionIcon>
  )
}
