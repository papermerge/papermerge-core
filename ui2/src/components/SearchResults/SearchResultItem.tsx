import {Group} from "@mantine/core"
import type {SearchResultNode} from "@/types"
import classes from "./item.module.css"

type Args = {
  item: SearchResultNode
  onClick: (item: SearchResultNode) => void
}

export default function SearchResultItem({item, onClick}: Args) {
  if (item.entity_type == "folder") {
    return (
      <Group
        className={classes.item}
        my={"sm"}
        align="center"
        onClick={() => onClick(item)}
      >
        <div className={classes.folderIcon}></div>
        <div className={classes.title}>{item.title}</div>
      </Group>
    )
  }

  return (
    <Group className={classes.item} my={"sm"} onClick={() => onClick(item)}>
      <div className={classes.title}>{item.title}</div>
    </Group>
  )
}
