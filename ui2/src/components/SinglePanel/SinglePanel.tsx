import {useContext} from "react"

import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import Viewer from "@/features/document/components/Viewer"
import Commander from "@/features/nodes/components/Commander"
import SearchResults from "@/features/search/components/SearchResults"
import SharedCommander from "@/features/shared_nodes/components/SharedCommander"
import SharedViewer from "@/features/shared_nodes/components/SharedViewer"
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

  if (panelComponent == "sharedCommander") {
    return <SharedCommander />
  }

  if (panelComponent == "sharedViewer") {
    return <SharedViewer />
  }

  return <>Error: neither viewer nor commander</>
}
