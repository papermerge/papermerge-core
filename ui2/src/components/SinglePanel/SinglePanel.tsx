import {useContext} from "react"

import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import Viewer from "@/features/document/components/Viewer"
import Commander from "@/features/nodes/components/Commander"
import SearchResults from "@/features/search/components/SearchResults"
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
