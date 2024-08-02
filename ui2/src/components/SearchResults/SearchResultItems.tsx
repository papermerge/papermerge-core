import {useContext} from "react"
import {useSelector} from "react-redux"
import {RootState} from "@/app/types"
import {selectSearchResultItems} from "@/slices/dualPanel/dualPanel"
import SearchResultItem from "./SearchResultItem"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"

export default function SearchResultItems() {
  const mode: PanelMode = useContext(PanelContext)
  const items = useSelector((state: RootState) =>
    selectSearchResultItems(state, mode)
  )
  const itemComponents = items?.data?.map(i => <SearchResultItem item={i} />)

  return <div>{itemComponents}</div>
}
