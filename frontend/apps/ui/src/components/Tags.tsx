import type {TagType} from "@/types"
import Tag from "@/components/Tag"

interface Args {
  items: TagType[]
}

export default function Tags({items}: Args) {
  const components = items.map(i => <Tag key={i.id} item={i} />)
  return <>{components}</>
}
