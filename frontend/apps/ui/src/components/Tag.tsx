import {Pill} from "@mantine/core"
import type {TagType} from "@/types"

interface Args {
  item: TagType
}

export default function Tag({item}: Args) {
  return (
    <Pill style={{backgroundColor: item.bg_color, color: item.fg_color}}>
      {item.name}
    </Pill>
  )
}
