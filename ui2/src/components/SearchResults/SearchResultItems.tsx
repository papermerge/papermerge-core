import {useContext} from "react"
import {useSelector} from "react-redux"
import {RootState} from "@/app/types"
import {selectSearchResultItems} from "@/slices/dualPanel/dualPanel"
import SearchResultItem from "./SearchResultItem"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode, SearchResultNode} from "@/types"

type Args = {
  onClick: (item: SearchResultNode) => void
}

export default function SearchResultItems({onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const items = useSelector((state: RootState) =>
    selectSearchResultItems(state, mode)
  )
  const itemComponents = items?.data?.map(i => (
    <SearchResultItem key={i.id} item={i} onClick={onClick} />
  ))

  return <div>{itemComponents}</div>
}
