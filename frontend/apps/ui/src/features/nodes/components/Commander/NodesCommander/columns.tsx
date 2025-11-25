import Tags from "@/components/Tags"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {NodeType, TagType} from "@/types"
import {Box, Group} from "@mantine/core"
import {IconFile, IconFolder} from "@tabler/icons-react"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

export default function nodeColumns(t?: TFunction) {
  const columns: ColumnConfig<NodeType>[] = [
    {
      key: "title",
      label: t?.("tagColumns.name") || "Title",
      sortable: true,
      filterable: true,
      width: 390,
      minWidth: 150,
      render: (value, row, onClick) => {
        const Icon = row.ctype == "folder" ? <IconFolder /> : <IconFile />
        return (
          <Box
            style={{cursor: "pointer"}}
            onClick={() => onClick?.(row, false)}
          >
            <Group>
              {Icon}
              <TruncatedTextWithCopy maxLength={24} value={value as string} />
            </Group>
          </Box>
        )
      }
    },
    {
      key: "id",
      label: t?.("tagColumns.id") || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "tags",
      label: t?.("tagColumns.id") || "Tags",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Tags items={value as TagType[]} />
    }
  ]
  return columns
}
