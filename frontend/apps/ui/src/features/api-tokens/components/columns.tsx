import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {APIToken} from "@/features/api-tokens/types"
import {Badge, Group, Text} from "@mantine/core"
import {IconKey} from "@tabler/icons-react"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

interface Args {
  t?: TFunction
}

export default function tokenColumns({t}: Args): ColumnConfig<APIToken>[] {
  const columns: ColumnConfig<APIToken>[] = [
    {
      key: "name",
      label: t?.("tokenColumns.name", {defaultValue: "Name"}) || "Name",
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: (value, row) => {
        const isExpired =
          row.expires_at && new Date(row.expires_at) < new Date()
        return (
          <Group gap="xs">
            <IconKey size={16} />
            <Text fw={500}>{value as string}</Text>
            {isExpired && (
              <Badge color="red" size="xs">
                {t?.("api_tokens.expired", {defaultValue: "Expired"}) ||
                  "Expired"}
              </Badge>
            )}
          </Group>
        )
      }
    },
    {
      key: "token_prefix",
      label: t?.("tokenColumns.token", {defaultValue: "Token"}) || "Token",
      sortable: false,
      filterable: false,
      visible: true,
      width: 150,
      minWidth: 100,
      render: value => (
        <Text c="dimmed" ff="monospace" size="sm">
          pm_{value as string}...
        </Text>
      )
    },
    {
      key: "id",
      label: t?.("tokenColumns.id", {defaultValue: "ID"}) || "ID",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "created_at",
      label:
        t?.("tokenColumns.created_at", {defaultValue: "Created"}) || "Created",
      sortable: true,
      filterable: true,
      visible: true,
      width: 180,
      minWidth: 120,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "expires_at",
      label:
        t?.("tokenColumns.expires_at", {defaultValue: "Expires"}) || "Expires",
      sortable: true,
      filterable: true,
      visible: true,
      width: 180,
      minWidth: 120,
      render: value => {
        if (!value) {
          return (
            <Text size="sm" c="dimmed">
              {t?.("api_tokens.never", {defaultValue: "Never"}) || "Never"}
            </Text>
          )
        }
        return <TimestampZ value={value as string} />
      }
    },
    {
      key: "last_used_at",
      label:
        t?.("tokenColumns.last_used_at", {defaultValue: "Last Used"}) ||
        "Last Used",
      sortable: true,
      filterable: true,
      visible: true,
      width: 180,
      minWidth: 120,
      render: value => {
        if (!value) {
          return (
            <Text size="sm" c="dimmed">
              {t?.("api_tokens.never_used", {defaultValue: "Never used"}) ||
                "Never used"}
            </Text>
          )
        }
        return <TimestampZ value={value as string} />
      }
    }
  ]

  return columns
}
