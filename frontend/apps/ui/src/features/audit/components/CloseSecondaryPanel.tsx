import {useAppDispatch} from "@/app/hooks"
import {ActionIcon} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import {useContext} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {closeAuditLogDetailsSecondaryPanel} from "@/features/audit/storage/thunks"

export default function CloseSecondaryPanel() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()

  if (mode == "main") {
    return <></>
  }

  return (
    <ActionIcon
      onClick={() => dispatch(closeAuditLogDetailsSecondaryPanel())}
      size="lg"
      variant="default"
    >
      <IconX size={18} />
    </ActionIcon>
  )
}
