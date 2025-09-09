import {ActionIcon} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import {useContext} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

interface Args {
  onClick: () => void
}

export default function CloseSecondaryPanel({onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)

  if (mode == "main") {
    return <></>
  }

  return (
    <ActionIcon onClick={onClick} size="lg" variant="default">
      <IconX size={18} />
    </ActionIcon>
  )
}
