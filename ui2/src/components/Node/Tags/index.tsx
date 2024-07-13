import {useSelector} from "react-redux"
import {Pill, Stack} from "@mantine/core"
import {selectTagsByName} from "@/slices/tags"
import type {ColoredTagType} from "@/types"
import classes from "./Tags.module.css"
import {RootState} from "@/app/types"

type Args = {
  names: Array<string>
  maxItems?: number
}

export default function Tags({names, maxItems}: Args) {
  const tags = useSelector((state: RootState) =>
    selectTagsByName(state, names)
  ) as Array<ColoredTagType>

  if (!maxItems) {
    maxItems = 4
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
