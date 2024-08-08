import {useContext} from "react"
import {Group} from "@mantine/core"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import PanelContext from "@/contexts/PanelContext"
import EditTitleButton from "./EditTitleButton"

import type {PanelMode} from "@/types"

export default function ActionButtons() {
  const mode: PanelMode = useContext(PanelContext)

  return (
    <Group className={`${mode}-action-panel`} justify="space-between">
      <Group>
        <EditTitleButton />
      </Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
