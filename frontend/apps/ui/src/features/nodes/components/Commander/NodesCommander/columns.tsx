import Owner from "@/components/Owner"
import Tags from "@/components/Tags"
import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {NodeType, TagType} from "@/types"
import {OwnedBy} from "@/types"
import type {ByUser} from "@/types.d/common"
import {Box, Group, Text} from "@mantine/core"
import {IconFile, IconFolderFilled} from "@tabler/icons-react"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

export default function nodeColumns(t?: TFunction) {
  const columns: ColumnConfig<NodeType>[] = [
    {
      key: "title",
      label: t?.("commonColumns.title") || "Title",
      sortable: true,
      filterable: true,
      width: 390,
      minWidth: 150,
      render: (value, row, onClick) => {
        const Icon =
          row.ctype == "folder" ? (
            <IconFolderFilled color="orange" />
          ) : (
            <IconFile />
          )
        return (
          <Box
            style={{cursor: "pointer"}}
            onClick={event => onClick?.(row, false, event)}
            onAuxClick={event => onClick?.(row, false, event)} // for middle-click
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
      label: t?.("commonColumns.id") || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "tags",
      label: t?.("commonColumns.tags") || "Tags",
      sortable: false,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Tags items={value as TagType[]} />
    },
    {
      key: "ctype",
      label: t?.("commonColumns.type") || "Kind",
      sortable: true,
      filterable: true,
      visible: true,
      width: 150,
      minWidth: 120,
      render: value => <Text>{t?.(value as string)}</Text>
    },
    {
      key: "owned_by",
      label: t?.("commonColumns.owned_by") || "Owned By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 150,
      minWidth: 120,
      render: value => {
        return <Owner value={value as OwnedBy} />
      }
    },
    {
      key: "created_at",
      label: t?.("commonColumns.created_at") || "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "created_by",
      label: t?.("commonColumns.created_by") || "Created By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => (
        <Text size="sm">{value && (value as ByUser).username}</Text>
      )
    },
    {
      key: "updated_at",
      label: t?.("commonColumns.updated_at") || "Updated At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "updated_by",
      label: t?.("commonColumns.updated_by") || "updated By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => (
        <Text size="sm">{value && (value as ByUser).username}</Text>
      )
    }
  ]
  return columns
}
