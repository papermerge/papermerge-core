import Tags from "@/components/Tags"
import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {
  Category,
  DocumentListItem
} from "@/features/documents-by-category/types"
import {ByUser, TagType} from "@/types"
import {Box, Text} from "@mantine/core"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

export default function flatColumns(t?: TFunction) {
  const columns: ColumnConfig<DocumentListItem>[] = [
    {
      key: "title",
      label:
        t?.("documentsByCategory.title", {defaultValue: "Title"}) || "Title",
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: (value, row, onClick) => {
        return (
          <Box
            style={{cursor: "pointer"}}
            onClick={() => onClick?.(row, false)}
          >
            <Text component="a">{value as string}</Text>
          </Box>
        )
      }
    },
    {
      key: "id",
      label: t?.("documentsByCategory.id", {defaultValue: "ID"}) || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "category",
      label:
        t?.("documentsByCategory.category", {defaultValue: "Category"}) ||
        "Category",
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: value => (
        <Text size="sm">{value && (value as Category).name}</Text>
      )
    },
    {
      key: "tags",
      label: t?.("documentsByCategory.tags", {defaultValue: "Tags"}) || "Tags",
      sortable: false,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: value => <Tags items={value as TagType[]} />
    },
    {
      key: "created_at",
      label:
        t?.("documentsByCategory.created_at", {defaultValue: "Created At"}) ||
        "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "created_by",
      label:
        t?.("documentsByCategory.created_by", {defaultValue: "Created By"}) ||
        "Created By",
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
      label:
        t?.("documentsByCategory.updated_at", {defaultValue: "Updated At"}) ||
        "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "updated_by",
      label:
        t?.("documentsByCategory.updated_by", {defaultValue: "Updated By"}) ||
        "updated By",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    }
  ]

  return columns
}
