import {Group, Pill, Skeleton} from "@mantine/core"

import type {NodeTag} from "@/types"

type Args = {
  items: Array<NodeTag>
  maxItems?: number
}

export default function Tags({items, maxItems}: Args) {
  if (!items) {
    return <Skeleton height={18} width={45} />
  }

  if (!maxItems) {
    maxItems = 4
  }

  let tags_list = items.map(item => (
    <Pill
      key={item.name}
      style={{backgroundColor: item.bg_color, color: item.fg_color}}
    >
      {item.name}
    </Pill>
  ))

  if (tags_list.length > maxItems) {
    tags_list.splice(maxItems)
    tags_list.push(<span>...</span>)
  }

  return <Group gap="xs">{tags_list}</Group>
}
