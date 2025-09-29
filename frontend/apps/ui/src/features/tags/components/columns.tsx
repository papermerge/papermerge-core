import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {TagItem} from "@/features/tags/types"
import type {ByUser} from "@/types.d/common"
import {Box, Text} from "@mantine/core"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

export default function tagColumns(t?: TFunction) {
  const columns: ColumnConfig<TagItem>[] = [
    {
      key: "name",
      label: t?.("tagColumns.name") || "Name",
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
      label: t?.("tagColumns.id") || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "created_at",
      label: t?.("tagColumns.created_at") || "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "created_by",
      label: t?.("tagColumns.created_by") || "Created By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    },
    {
      key: "updated_at",
      label: t?.("tagColumns.updated_at") || "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "updated_by",
      label: t?.("tagColumns.updated_by") || "updated By",
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
