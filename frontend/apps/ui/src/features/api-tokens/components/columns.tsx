import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {APIToken} from "@/features/api-tokens/types"
import {ActionIcon, Badge, Group, Text, Tooltip} from "@mantine/core"
import {IconKey, IconTrash} from "@tabler/icons-react"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

type TokenColumnsOptions = {
  t?: TFunction
  onDelete?: (tokenId: string) => void
}

export default function tokenColumns(
  options: TokenColumnsOptions = {}
): ColumnConfig<APIToken>[] {
  const {t, onDelete} = options

  const columns: ColumnConfig<APIToken>[] = [
    {
      key: "name",
      label: t?.("tokenColumns.name") || "Name",
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
      label: t?.("tokenColumns.token") || "Token",
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
      label: t?.("tokenColumns.id") || "ID",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "scopes",
      label: t?.("tokenColumns.scopes") || "Scopes",
      sortable: false,
      filterable: false,
      visible: true,
      width: 200,
      minWidth: 150,
      render: value => {
        const scopes = value as string[] | null
        if (scopes && scopes.length > 0) {
          return (
            <Group gap={4}>
              {scopes.slice(0, 3).map(scope => (
                <Badge key={scope} size="xs" variant="light">
                  {scope}
                </Badge>
              ))}
              {scopes.length > 3 && (
                <Badge size="xs" variant="light">
                  +{scopes.length - 3}
                </Badge>
              )}
            </Group>
          )
        }
        return (
          <Text c="dimmed" size="sm">
            {t?.("api_tokens.all_permissions", {
              defaultValue: "All permissions"
            }) || "All permissions"}
          </Text>
        )
      }
    },
    {
      key: "created_at",
      label: t?.("tokenColumns.created_at") || "Created",
      sortable: true,
      filterable: true,
      visible: true,
      width: 180,
      minWidth: 120,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "expires_at",
      label: t?.("tokenColumns.expires_at") || "Expires",
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
      label: t?.("tokenColumns.last_used_at") || "Last Used",
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
    },
    {
      key: "actions" as keyof APIToken,
      label: "",
      sortable: false,
      filterable: false,
      visible: true,
      width: 60,
      minWidth: 60,
      render: (_value, row) => {
        return (
          <Tooltip
            label={
              t?.("api_tokens.revoke", {defaultValue: "Revoke token"}) ||
              "Revoke token"
            }
          >
            <ActionIcon
              color="red"
              variant="subtle"
              onClick={e => {
                e.stopPropagation()
                onDelete?.(row.id)
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        )
      }
    }
  ]

  return columns
}
