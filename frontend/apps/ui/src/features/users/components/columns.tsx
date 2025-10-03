import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {ByUser, UserItem} from "@/features/users/types"
import {Box, Text} from "@mantine/core"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

export default function userColumns(t?: TFunction) {
  const columns: ColumnConfig<UserItem>[] = [
    {
      key: "username",
      label: t?.("username") || "Username",
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
      key: "email",
      label: t?.("email") || "EMail",
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
      label: t?.("id") || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "created_at",
      label: t?.("created_at") || "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "created_by",
      label: t?.("created_by") || "Created By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    },
    {
      key: "updated_at",
      label: t?.("updated_at") || "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "updated_by",
      label: t?.("updated_by") || "updated By",
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
