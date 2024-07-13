import {Pill, Stack} from "@mantine/core"
import type {ColoredTagType} from "@/types"
import classes from "./Tags.module.css"

type Args = {
  tags: Array<ColoredTagType>
  maxItems?: number
}

export default function Tags({tags, maxItems}: Args) {
  if (!maxItems) {
    maxItems = 4
  }

  if (!tags) {
    return <ul className="tags"></ul>
  }

  let tags_list = tags.map((item: ColoredTagType) => (
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
