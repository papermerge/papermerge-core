import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  CopyButton,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Tooltip
} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {
  IconCheck,
  IconCopy,
  IconKey,
  IconPlus,
  IconTrash
} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import {
  useDeleteAPITokenMutation,
  useGetAPITokensQuery
} from "@/features/api-tokens/apiSlice"
import type {APIToken} from "@/features/api-tokens/types"
import CreateTokenModal from "./CreateTokenModal"

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function TokenRow({token, onDelete}: {token: APIToken; onDelete: () => void}) {
  const {t} = useTranslation()
  const isExpired =
    token.expires_at && new Date(token.expires_at) < new Date()

  return (
    <Table.Tr style={{opacity: isExpired ? 0.5 : 1}}>
      <Table.Td>
        <Group gap="xs">
          <IconKey size={16} />
          <Text fw={500}>{token.name}</Text>
          {isExpired && (
            <Badge color="red" size="xs">
              {t("api_tokens.expired", {defaultValue: "Expired"})}
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text c="dimmed" ff="monospace" size="sm">
          pm_{token.token_prefix}...
        </Text>
      </Table.Td>
      <Table.Td>
        {token.scopes ? (
          <Group gap={4}>
            {token.scopes.slice(0, 3).map(scope => (
              <Badge key={scope} size="xs" variant="light">
                {scope}
              </Badge>
            ))}
            {token.scopes.length > 3 && (
              <Badge size="xs" variant="light">
                +{token.scopes.length - 3}
              </Badge>
            )}
          </Group>
        ) : (
          <Text c="dimmed" size="sm">
            {t("api_tokens.all_permissions", {defaultValue: "All permissions"})}
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatDate(token.created_at)}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">
          {token.expires_at
            ? formatDate(token.expires_at)
            : t("api_tokens.never", {defaultValue: "Never"})}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {token.last_used_at
            ? formatDate(token.last_used_at)
            : t("api_tokens.never_used", {defaultValue: "Never used"})}
        </Text>
      </Table.Td>
      <Table.Td>
        <Tooltip
          label={t("api_tokens.revoke", {defaultValue: "Revoke token"})}
        >
          <ActionIcon color="red" variant="subtle" onClick={onDelete}>
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  )
}

export default function TokenList() {
  const {t} = useTranslation()
  const {data: tokens, isLoading, error} = useGetAPITokensQuery()
  const [deleteToken] = useDeleteAPITokenMutation()
  const [createModalOpened, {open: openCreateModal, close: closeCreateModal}] =
    useDisclosure(false)

  const handleDelete = async (tokenId: string) => {
    if (
      window.confirm(
        t("api_tokens.confirm_delete", {
          defaultValue:
            "Are you sure you want to revoke this token? This action cannot be undone."
        })
      )
    ) {
      await deleteToken(tokenId)
    }
  }

  if (isLoading) {
    return (
      <Stack align="center" p="xl">
        <Loader />
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert color="red" title={t("common.error", {defaultValue: "Error"})}>
        {t("api_tokens.load_error", {
          defaultValue: "Failed to load API tokens"
        })}
      </Alert>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Text size="lg" fw={500}>
            {t("api_tokens.title", {defaultValue: "API Tokens"})}
          </Text>
          <Text size="sm" c="dimmed">
            {t("api_tokens.description", {
              defaultValue:
                "Personal access tokens for CLI tools, scripts, and integrations"
            })}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          {t("api_tokens.create", {defaultValue: "Create Token"})}
        </Button>
      </Group>

      {tokens && tokens.length > 0 ? (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                {t("api_tokens.name", {defaultValue: "Name"})}
              </Table.Th>
              <Table.Th>
                {t("api_tokens.token", {defaultValue: "Token"})}
              </Table.Th>
              <Table.Th>
                {t("api_tokens.scopes", {defaultValue: "Scopes"})}
              </Table.Th>
              <Table.Th>
                {t("api_tokens.created", {defaultValue: "Created"})}
              </Table.Th>
              <Table.Th>
                {t("api_tokens.expires", {defaultValue: "Expires"})}
              </Table.Th>
              <Table.Th>
                {t("api_tokens.last_used", {defaultValue: "Last Used"})}
              </Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tokens.map(token => (
              <TokenRow
                key={token.id}
                token={token}
                onDelete={() => handleDelete(token.id)}
              />
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Alert color="gray">
          <Stack align="center" gap="md">
            <IconKey size={48} opacity={0.5} />
            <Text>
              {t("api_tokens.empty", {
                defaultValue: "No API tokens yet"
              })}
            </Text>
            <Text size="sm" c="dimmed">
              {t("api_tokens.empty_hint", {
                defaultValue:
                  "Create a token to access the Papermerge API from CLI tools or scripts"
              })}
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openCreateModal}
            >
              {t("api_tokens.create_first", {
                defaultValue: "Create Your First Token"
              })}
            </Button>
          </Stack>
        </Alert>
      )}

      <CreateTokenModal opened={createModalOpened} onClose={closeCreateModal} />
    </Stack>
  )
}
