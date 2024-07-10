import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectSecondaryPanel} from "@/slices/dualPanel/dualPanel"
import SinglePanel from "@/components/SinglePanel"

import PanelContext from "@/contexts/PanelContext"

export default function DualPanel() {
  const secondaryPanel = useSelector(selectSecondaryPanel)

  if (secondaryPanel) {
    return (
      <Group grow align="flex-start" justify="space-between">
        <PanelContext.Provider value={"main"}>
          <SinglePanel />
        </PanelContext.Provider>
        <PanelContext.Provider value={"secondary"}>
          <SinglePanel />
        </PanelContext.Provider>
      </Group>
    )
  }

  return (
    <PanelContext.Provider value={"main"}>
      <SinglePanel />
    </PanelContext.Provider>
  )
}
