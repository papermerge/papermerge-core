import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectPanels} from "@/slices/dualPanel"
import SinglePanel from "@/components/SinglePanel"

import PanelContext from "@/contexts/PanelContext"

export default function DualPanel() {
  const [_, secondaryPanel] = useSelector(selectPanels)

  if (secondaryPanel) {
    return (
      <Group grow justify="space-between">
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
