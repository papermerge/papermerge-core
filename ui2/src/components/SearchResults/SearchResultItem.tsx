import type {SearchResultNode} from "@/types"

type Args = {
  item: SearchResultNode
}

export default function SearchResultItem({item}: Args) {
  return <div>{item.title}</div>
}
