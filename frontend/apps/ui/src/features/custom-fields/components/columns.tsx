import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {CustomFieldItem} from "@/features/custom-fields/types"
import {OwnedBy} from "@/types"
import type {ByUser} from "@/types.d/common"
import {Box, Group, Text} from "@mantine/core"
import {IconUser, IconUsersGroup} from "@tabler/icons-react"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

interface OwnerArgs {
  value: OwnedBy
}

function Owner({value}: OwnerArgs) {
  if (value.type == "group") {
    return (
      <Group gap="xs">
        <IconUsersGroup size={18} />
        <Text>{value.name}</Text>
      </Group>
    )
  }
  return (
    <Group gap="xs">
      <IconUser size={18} />
      <Text>{value.name}</Text>
    </Group>
  )
}

export default function customFieldColumns(t?: TFunction) {
  const columns: ColumnConfig<CustomFieldItem>[] = [
    {
      key: "name",
      label: t?.("customFieldColumns.name") || "Name",
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
      key: "type",
      label: t?.("customFieldColumns.type") || "Type",
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: value => {
        const val = value as string
        const key = `customFieldType.${value}`
        const finalValue = `${t?.(key) || val} (${val})`

        return <TruncatedTextWithCopy maxLength={24} value={finalValue} />
      }
    },
    {
      key: "id",
      label: t?.("customFieldColumns.id") || "ID",
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
      label: t?.("customFieldColumns.created_at") || "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "created_by",
      label: t?.("customFieldColumns.created_by") || "Created By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    },
    {
      key: "updated_at",
      label: t?.("customFieldColumns.updated_at") || "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{value as string}</Text>
    },
    {
      key: "updated_by",
      label: t?.("customFieldColumns.updated_by") || "updated By",
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
