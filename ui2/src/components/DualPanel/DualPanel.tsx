import {Group} from "@mantine/core"
import {useAppSelector} from "@/app/hooks"
import SinglePanel from "@/components/SinglePanel"

import PanelContext from "@/contexts/PanelContext"
import {selectPanelComponent} from "@/features/ui/uiSlice"

export default function DualPanel() {
  const secondayPanelComponent = useAppSelector(s =>
    selectPanelComponent(s, "secondary")
  )

  if (secondayPanelComponent) {
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
