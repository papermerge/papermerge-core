import {useContext} from "react"

import {
  selectCommander,
  selectViewer,
  selectSearchResults
} from "@/slices/dualPanel/dualPanel"
import {useSelector} from "react-redux"
import Commander from "@/components/Commander"
import Viewer from "@/components/Viewer"
import SearchResults from "@/components/SearchResults"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"
import {RootState} from "@/app/types"

export default function SinglePanel() {
  const mode: PanelMode = useContext(PanelContext)
  const commander = useSelector((state: RootState) =>
    selectCommander(state, mode)
  )
  const viewer = useSelector((state: RootState) => selectViewer(state, mode))
  const searchResults = useSelector((state: RootState) =>
    selectSearchResults(state, mode)
  )

  if (commander) {
    return <Commander />
  }

  if (viewer) {
    return <Viewer />
  }

  if (searchResults) {
    return <SearchResults />
  }

  return <>Error: neither viewer nor commander</>
}
