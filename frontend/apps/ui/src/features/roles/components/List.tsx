import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useRoleTable from "@/features/roles/hooks/useRoleTable"
import useVisibleColumns from "@/features/roles/hooks/useVisibleColumns"
import {
  clearSelection,
  selectionAddMany,
  selectLastPageSize,
  selectSelectedIds
} from "@/features/roles/rolesSlice"
import {roleListSortingUpdated} from "@/features/ui/uiSlice"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Center, Group, Loader, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"
import roleColumns from "./roleColumns"

import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function RolesList() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()
  const lastPageSize = useSelector(selectLastPageSize)
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(roleColumns(t))

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useRoleTable()

  const handleSortChange = (value: SortState) => {
    dispatch(roleListSortingUpdated({mode, value}))
  }

  const onCheckAll = (checked: boolean) => {
    if (!data) {
      console.log(`undefined data`)
      return
    }

    if (checked) {
      // check all/select all role items
      dispatch(selectionAddMany(data.items.map(i => i.id)))
    } else {
      // uncheck all/unselect all role items
      dispatch(clearSelection())
    }
  }

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
        emptyMessage={t?.("rolesList.noRolesFound") || "No roles found"}
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

function Empty() {
  const {t} = useTranslation()
  return (
    <Center>
      <Stack align="center">
        <div>{t("roles.list.empty")}</div>
      </Stack>
    </Center>
  )
}
