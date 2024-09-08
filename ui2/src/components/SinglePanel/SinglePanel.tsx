import {useContext} from "react"

import {useAppSelector} from "@/app/hooks"
import Commander from "@/features/nodes/components/Commander"
import Viewer from "@/components/Viewer"
import SearchResults from "@/components/SearchResults"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"

import {selectPanelComponent} from "@/features/ui/uiSlice"

export default function SinglePanel() {
  const mode: PanelMode = useContext(PanelContext)
  const panelComponent = useAppSelector(s => selectPanelComponent(s, mode))

  if (panelComponent == "commander") {
    return <Commander />
  }

  if (panelComponent == "viewer") {
    return <Viewer />
  }

  if (panelComponent == "searchResults") {
    return <SearchResults />
  }

  return <>Error: neither viewer nor commander</>
}
