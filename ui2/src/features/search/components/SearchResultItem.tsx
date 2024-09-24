import {useAppSelector} from "@/app/hooks"
import {selectNodeById} from "@/features/search/searchSlice"
import type {CType, NType, SearchResultNode} from "@/types"
import {Group, Stack} from "@mantine/core"
import Breadcrumb from "./Breadcrumb"
import Tags from "./Tags"
import classes from "./item.module.css"

type Args = {
  item: SearchResultNode
  onClick: (n: NType, page?: number) => void
}

export default function SearchResultItem({item, onClick}: Args) {
  const item_id = (
    item.entity_type == "document" ? item.document_id : item.id
  ) as string
  const nodeDetails = useAppSelector(s => selectNodeById(s, item_id))

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
        <Breadcrumb onClick={onClick} items={nodeDetails?.breadcrumb} />

        <Group
          className={classes.item}
          align="center"
          onClick={onLocalClickFolderItem}
        >
          <div className={classes.folderIcon}></div>
          <div className={classes.title}>{item.title}</div>
          <Tags items={nodeDetails?.tags} maxItems={8} />
        </Group>
      </Stack>
    )
  }

  return (
    <Stack my={"lg"} pt={"sm"} gap="xs">
      <Breadcrumb
        onClick={onClick}
        // for documents breadcrumb also indicates
        // page number (if page number > 1)
        pageNumber={item.page_number}
        items={nodeDetails?.breadcrumb}
      />
      <Group className={classes.item} onClick={onLocalClickDocumentItem}>
        <div className={classes.title}>{item.title}</div>
        <Tags items={nodeDetails?.tags} maxItems={8} />
      </Group>
    </Stack>
  )
}
