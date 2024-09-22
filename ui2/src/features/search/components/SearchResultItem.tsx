import {Group, Stack} from "@mantine/core"
import type {CType, NType, SearchResultNode} from "@/types"
import classes from "./item.module.css"
import Breadcrumb from "./Breadcrumb"
import Tags from "./Tags"

type Args = {
  item: SearchResultNode
  onClick: (n: NType, page?: number) => void
}

export default function SearchResultItem({item, onClick}: Args) {
  const onLocalClickDocumentItem = () => {
    const node = {
      id: item.document_id!,
      ctype: "document" as CType
    }
    const page = item.page_number!

    onClick(node, page)
  }

  const onLocalClickFolderItem = () => {
    const node = {
      id: item.id,
      ctype: "folder" as CType
    }
    onClick(node)
  }

  if (item.entity_type == "folder") {
    return (
      <Stack my={"lg"} gap="xs">
        <Breadcrumb onClick={onClick} items={item.breadcrumb || []} />

        <Group
          className={classes.item}
          align="center"
          onClick={onLocalClickFolderItem}
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
      <Breadcrumb
        onClick={onClick}
        pageNumber={item.page_number}
        items={item.breadcrumb || []}
      />
      <Group className={classes.item} onClick={onLocalClickDocumentItem}>
        <div className={classes.title}>{item.title}</div>
        <Tags items={item.tags} maxItems={8} />
      </Group>
    </Stack>
  )
}
