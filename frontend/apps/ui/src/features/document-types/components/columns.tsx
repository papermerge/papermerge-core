import Owner from "@/components/Owner"
import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {DocumentTypeItem} from "@/features/document-types/types"
import type {OwnedBy} from "@/types"
import type {ByUser} from "@/types.d/common"
import {Box, Text} from "@mantine/core"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

export default function documentTypeColumns(t?: TFunction) {
  const columns: ColumnConfig<DocumentTypeItem>[] = [
    {
      key: "name",
      label: t?.("documentTypeColumns.name") || "Name",
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
      label: t?.("documentTypeColumns.id") || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "owned_by",
      label: t?.("customFieldColumns.owned_by") || "Owned By",
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
      label: t?.("documentTypeColumns.created_at") || "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "created_by",
      label: t?.("documentTypeColumns.created_by") || "Created By",
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
      label: t?.("documentTypeColumns.updated_at") || "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "updated_by",
      label: t?.("documentTypeColumns.updated_by") || "updated By",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => (
        <Text size="sm">{value && (value as ByUser).username}</Text>
      )
    }
  ]
  return columns
}
