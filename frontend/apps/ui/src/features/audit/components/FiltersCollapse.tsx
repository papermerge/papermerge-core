import {useAppDispatch, useAppSelector} from "@/app/hooks"
import useFilterList from "@/features/audit/hooks/useFilterList"
import {
  auditLogFiltersCollapseUpdated,
  auditLogOperationFilterValueCleared,
  auditLogTableNameFilterValueCleared,
  auditLogTimestampFilterValueCleared,
  selectAuditLogFiltersCollapse
} from "@/features/ui/uiSlice"
import {Box, Group, Paper, UnstyledButton} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"
import React, {forwardRef, useEffect} from "react"
import type {AuditLogQueryParams} from "../types"

import {usePanelMode} from "@/hooks"
import OperationFilter, {useOperationFilter} from "./OperationFilter"
import TableNameFilter, {useTableNameFilter} from "./TableNameFilter"
import TimestampFilter, {useTimestampFilter} from "./TimestampFilter"
import UserFilter from "./UserFilter"

import {
  OPERATION_FILTER_KEY,
  TABLE_NAME_FILTER_KEY,
  TIMESTAMP_FILTER_KEY,
  USER_FILTER_KEY
} from "@/features/audit/constants"

interface Args {
  className?: string
  setQueryParams: React.Dispatch<React.SetStateAction<AuditLogQueryParams>>
}

const FiltersCollapse = forwardRef<HTMLDivElement, Args>(
  ({className, setQueryParams}, ref) => {
    const mode = usePanelMode()
    const dispatch = useAppDispatch()
    const filtersList = useFilterList()
    const visibleFiltersOnly = filtersList.filter(f => f.visible)
    const expanded = useAppSelector(s => selectAuditLogFiltersCollapse(s, mode))

    /* If user opens audit log table with <FiltersCollapse /> closed i.e.none
    of the filters visible - then filters should be applied anyway */
    const {clear: clearTimestampFilter} = useTimestampFilter({setQueryParams})
    const {clear: clearOperationFilter} = useOperationFilter({setQueryParams})
    const {clear: clearTableNameFilter} = useTableNameFilter({setQueryParams})

    const toggleExpanded = () => {
      dispatch(auditLogFiltersCollapseUpdated({value: !expanded, mode}))
    }

    useEffect(() => {
      filtersList.forEach(f => {
        if (!f.visible) {
          switch (f.key) {
            case TIMESTAMP_FILTER_KEY:
              dispatch(
                auditLogTimestampFilterValueCleared({
                  mode
                })
              )
              clearTimestampFilter()
              break
            case OPERATION_FILTER_KEY:
              dispatch(
                auditLogOperationFilterValueCleared({
                  mode
                })
              )
              clearOperationFilter()
              break
            case TABLE_NAME_FILTER_KEY:
              dispatch(
                auditLogTableNameFilterValueCleared({
                  mode
                })
              )
              clearTableNameFilter()
              break
          }
        }
      })
    }, [filtersList])

    let filterComponents: React.ReactElement[] = []

    if (visibleFiltersOnly.length == 0) {
      return <></>
    }

    visibleFiltersOnly.forEach(f => {
      if (f.visible) {
        switch (f.key) {
          case TIMESTAMP_FILTER_KEY:
            filterComponents.push(
              <TimestampFilter key={f.key} setQueryParams={setQueryParams} />
            )
            break
          case OPERATION_FILTER_KEY:
            filterComponents.push(
              <OperationFilter key={f.key} setQueryParams={setQueryParams} />
            )
            break
          case TABLE_NAME_FILTER_KEY:
            filterComponents.push(
              <TableNameFilter key={f.key} setQueryParams={setQueryParams} />
            )
            break
          case USER_FILTER_KEY:
            filterComponents.push(<UserFilter key={f.key} />)
            break
        }
      }
    })

    return (
      <Paper
        ref={ref}
        className={`filters-collapse ${className}`}
        withBorder
        radius={"xs"}
        style={{overflow: "hidden"}}
      >
        <UnstyledButton
          onClick={toggleExpanded}
          w="100%"
          p="xs"
          style={{
            outline: "none",
            boxShadow: "none",
            "&:focus": {
              outline: "none",
              boxShadow: "none"
            },
            "&:active": {
              outline: "none",
              boxShadow: "none"
            }
          }}
        >
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start"
            }}
          >
            <IconChevronDown
              size={20}
              style={{
                transform: expanded ? "rotate(0deg)" : "rotate(90deg)",
                transition: "transform 0.2s ease-in-out"
              }}
            />
          </Box>
        </UnstyledButton>

        {expanded && (
          <Box p="sm">
            <Group align={"baseline"} gap="sm">
              {filterComponents}
            </Group>
          </Box>
        )}
      </Paper>
    )
  }
)

export default FiltersCollapse
