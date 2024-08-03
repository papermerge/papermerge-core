import {Group, Stack} from "@mantine/core"
import type {NType, SearchResultNode} from "@/types"
import classes from "./item.module.css"
import Breadcrumb from "./Breadcrumb"
import Tags from "./Tags"

type Args = {
  item: SearchResultNode
  onClick: (n: NType) => void
}

export default function SearchResultItem({item, onClick}: Args) {
  if (item.entity_type == "folder") {
    return (
      <Stack my={"lg"} gap="xs">
        <Breadcrumb onClick={onClick} items={item.breadcrumb || []} />

        <Group
          className={classes.item}
          align="center"
          onClick={() => onClick({id: item.id, ctype: "folder"})}
        >
          <div className={classes.folderIcon}></div>
          <div className={classes.title}>{item.title}</div>
          <Tags items={item.tags} maxItems={8} />
        </Group>
      </Stack>
    )
  }

  return (
    <Stack my={"lg"} pt={"sm"} gap="xs">
      <Breadcrumb onClick={onClick} items={item.breadcrumb || []} />

      <Group
        className={classes.item}
        onClick={() => onClick({id: item.id, ctype: "document"})}
      >
        <div className={classes.title}>{item.title}</div>
        <Tags items={item.tags} maxItems={8} />
      </Group>
    </Stack>
  )
}
