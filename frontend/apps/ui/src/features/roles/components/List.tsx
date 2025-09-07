import {useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useRoleTable from "@/features/roles/hooks/useRoleTable"
import useVisibleColumns from "@/features/roles/hooks/useVisibleColumns"
import {
  roleListSortingUpdated,
  selectionSet,
  selectSelectedIDs
} from "@/features/roles/storage/role"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Loader, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"
import type {RoleItem} from "../types"
import roleColumns from "./roleColumns"

import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function RolesList() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))
  const selectedRowsSet = new Set(selectedRowIDs || [])
  const dispatch = useDispatch()
  //const lastPageSize = useAppSelector(s => selectPageSize(s, mode))
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(roleColumns(t))

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useRoleTable()

  const handleSortChange = (value: SortState) => {
    dispatch(roleListSortingUpdated({mode, value}))
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const newIds = Array.from(newSelection)
    dispatch(selectionSet({ids: newIds, mode}))
  }

  const getRowId = (row: RoleItem) => row.id

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }

  return (
    <Stack>
      <Group w={"100%"}>
        <ActionButtons /> {isFetching && <Loader size={"sm"} />}
      </Group>

      <DataTable
        data={data?.items || []}
        columns={visibleColumns}
        sorting={{
          column: queryParams.sort_by,
          direction: queryParams.sort_direction || null
        }}
        onSortChange={handleSortChange}
        loading={isLoading || isFetching}
        emptyMessage={t("rolesList.noRolesFound", {
          defaultValue: "No roles found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        getRowId={getRowId}
      />

      <TablePagination
        currentPage={data?.page_number || 1}
        totalPages={data?.num_pages || 0}
        pageSize={data?.page_size || 15}
        totalItems={data?.total_items}
        t={t}
      />
    </Stack>
  )
}
