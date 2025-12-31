import {useAppSelector} from "@/app/hooks"
import type {APIToken} from "@/features/api-tokens/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Alert, Button, Group, Loader, Stack, Text} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconKey, IconPlus} from "@tabler/icons-react"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useMemo} from "react"
import {useTranslation} from "react-i18next"
import useTokenTable from "../hooks/useTokenTable"
import useVisibleColumns from "../hooks/useVisibleColumns"
import ActionButtons from "./ActionButtons"
import tokenColumns from "./columns"
import CreateTokenModal from "./CreateTokenModal"

export default function TokenList() {
  const {t} = useTranslation()
  const {panelId, actions} = usePanel()
  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const selectedRowsSet = new Set(selectedRowIDs || [])

  const {data, isLoading, isFetching, isError, error, queryParams} =
    useTokenTable()

  const [createModalOpened, {open: openCreateModal, close: closeCreateModal}] =
    useDisclosure(false)

  const columns = useMemo(() => tokenColumns({t}), [t])
  const visibleColumns = useVisibleColumns(columns)

  const handleSortChange = (value: SortState) => {
    actions.updateSorting(value)
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const arr = Array.from(newSelection)
    actions.setSelection(arr)
  }

  const handlePageSizeChange = (newValue: number) => {
    actions.updatePagination({pageSize: newValue})
  }

  const handlePageNumberChange = (pageNumber: number) => {
    actions.updatePagination({pageNumber})
  }

  const getRowId = (row: APIToken) => row.id

  if (isLoading) {
    return (
      <Stack align="center" p="xl">
        <Loader />
      </Stack>
    )
  }

  if (isError) {
    return (
      <Alert color="red" title={t("common.error", {defaultValue: "Error"})}>
        {t("api_tokens.load_error", {
          defaultValue: "Failed to load API tokens"
        })}
      </Alert>
    )
  }

  // Empty state - show when no tokens exist at all
  if (!data || data.items.length === 0) {
    return (
      <Stack m={"md"} w={"100%"}>
        <Header />
        <EmptyTable openCreateModal={openCreateModal} />
        <CreateTokenModal
          opened={createModalOpened}
          onClose={closeCreateModal}
        />
      </Stack>
    )
  }

  return (
    <Stack m={"md"} w={"100%"}>
      <Header />

      <ActionButtons onNewToken={openCreateModal} />

      <DataTable
        data={data.items}
        columns={visibleColumns}
        sorting={{
          column: queryParams.sort_by,
          direction: queryParams.sort_direction || null
        }}
        onSortChange={handleSortChange}
        loading={isLoading || isFetching}
        emptyMessage={t("api_tokens.empty", {
          defaultValue: "No API tokens found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        getRowId={getRowId}
        withSecondaryPanelTriggerColumn={false}
      />

      <TablePagination
        currentPage={data.page_number || 1}
        totalPages={data.num_pages || 0}
        pageSize={data.page_size || 15}
        onPageChange={handlePageNumberChange}
        onPageSizeChange={handlePageSizeChange}
        totalItems={data.items.length}
        t={t}
      />

      <CreateTokenModal opened={createModalOpened} onClose={closeCreateModal} />
    </Stack>
  )
}

function Header() {
  const {t} = useTranslation()
  return (
    <Group>
      <Text size="lg" fw={500}>
        {t("api_tokens.title", {defaultValue: "API Tokens"})}
      </Text>
      <Text size="sm" c="dimmed">
        {t("api_tokens.description", {
          defaultValue:
            "Personal access tokens for CLI tools, scripts, and integrations"
        })}
      </Text>
    </Group>
  )
}

interface ArgsEmptyTable {
  openCreateModal: () => void
}

function EmptyTable({openCreateModal}: ArgsEmptyTable) {
  const {t} = useTranslation()
  return (
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
        <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
          {t("api_tokens.create_first", {
            defaultValue: "Create Your First Token"
          })}
        </Button>
      </Stack>
    </Alert>
  )
}
