import {useAppSelector} from "@/app/hooks"
import SinglePanel from "@/components/SinglePanel"

import PanelContext from "@/contexts/PanelContext"
import {selectPanelComponent} from "@/features/ui/panelRegistry"

export default function DualPanel() {
  const secondaryPanelComponent = useAppSelector(s =>
    selectPanelComponent(s, "secondary")
  )

  if (secondaryPanelComponent) {
    return (
      <>
        <PanelContext.Provider value={"main"}>
          <SinglePanel className="main-panel" />
        </PanelContext.Provider>
        <PanelContext.Provider value={"secondary"}>
          <SinglePanel className="secondary-panel" />
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
