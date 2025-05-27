import {NType, SearchResultNode} from "@/types"
import {Text} from "@mantine/core"
import SearchResultItem from "./SearchResultItem"

type Args = {
  onClick: (n: NType, page?: number) => void
  items: Array<SearchResultNode>
}

export default function SearchResultItems({items, onClick}: Args) {
  if (items?.length == 0) {
    return <Text my={"md"}>Nothing was found</Text>
  }

  const itemComponents = items?.map(i => (
    <SearchResultItem key={i.id} item={i} onClick={onClick} />
  ))

  return <div>{itemComponents}</div>
}
