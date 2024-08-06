import {Text} from "@mantine/core"
import {useContext} from "react"
import {useSelector} from "react-redux"
import {RootState} from "@/app/types"
import {selectSearchResultItems} from "@/slices/dualPanel/dualPanel"
import SearchResultItem from "./SearchResultItem"
import PanelContext from "@/contexts/PanelContext"
import {NType, PanelMode} from "@/types"

type Args = {
  onClick: (n: NType, page?: number) => void
}

export default function SearchResultItems({onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const items = useSelector((state: RootState) =>
    selectSearchResultItems(state, mode)
  )

  if (items?.data?.length == 0) {
    return <Text my={"md"}>Nothing was found</Text>
  }

  const itemComponents = items?.data?.map(i => (
    <SearchResultItem key={i.id} item={i} onClick={onClick} />
  ))

  return <div>{itemComponents}</div>
}
