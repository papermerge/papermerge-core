import type {SearchResultNode} from "@/types"

type Args = {
  item: SearchResultNode
  onClick: (item: SearchResultNode) => void
}

export default function SearchResultItem({item, onClick}: Args) {
  return <div onClick={() => onClick(item)}>{item.title}</div>
}
