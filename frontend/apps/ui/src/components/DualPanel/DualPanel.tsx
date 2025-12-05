import {useAppSelector} from "@/app/hooks"
import SinglePanel from "@/components/SinglePanel"

import PanelContext from "@/contexts/PanelContext"
import {
  selectMainPanelWidth,
  selectPanelComponent
} from "@/features/ui/panelRegistry"

import PanelResizer from "./PanelResizer"

export default function DualPanel() {
  const secondaryPanelComponent = useAppSelector(s =>
    selectPanelComponent(s, "secondary")
  )
  const mainPanelWidth = useAppSelector(selectMainPanelWidth)

  if (secondaryPanelComponent) {
    // Calculate secondary panel width (remaining space)
    const secondaryPanelWidth = 100 - mainPanelWidth

    return (
      <>
        <PanelContext.Provider value={"main"}>
          <SinglePanel
            className="main-panel"
            style={{flex: `0 0 ${mainPanelWidth}%`}}
          />
        </PanelContext.Provider>
        <PanelResizer />
        <PanelContext.Provider value={"secondary"}>
          <SinglePanel
            className="secondary-panel"
            style={{flex: `0 0 ${secondaryPanelWidth}%`}}
          />
        </PanelContext.Provider>
      </>
    )
  }

  return (
    <PanelContext.Provider value={"main"}>
      <SinglePanel className="main-panel" />
    </PanelContext.Provider>
  )
}
