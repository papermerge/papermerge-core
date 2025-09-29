import {useGetTagsQuery} from "@/features/tags/storage/api"
import type {ColoredTagType, NodeType} from "@/types"
import {Pill, Stack} from "@mantine/core"
import classes from "./Tags.module.css"

type Args = {
  names: Array<string>
  maxItems?: number
  node?: NodeType
}

export default function Tags({maxItems, node, names}: Args) {
  const {data: allTags, isLoading} = useGetTagsQuery(node?.group_id)

  if (!allTags || isLoading) {
    return <Stack></Stack>
  }

  if (!maxItems) {
    maxItems = 4
  }

  let tags_list = allTags
    .filter(t => names.includes(t.name))
    .map((item: ColoredTagType) => (
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

  return (
    <Stack gap="xs" className={classes.tags}>
      {tags_list}
    </Stack>
  )
}
