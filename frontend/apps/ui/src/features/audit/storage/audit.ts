import type {RootState} from "@/app/types"
import {PanelMode} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {Pagination, SortState} from "kommon"
import {AuditOperation, TimestampFilterType} from "../types"

interface AuditLogPanelList extends PanelListBase {
  timestampFilterValue?: TimestampFilterType
  operationFilterValue?: Array<AuditOperation>
  tableNameFilterValue?: Array<string>
  usernameFilterValue?: Array<string>
}

interface AuditLogPanelDetails {
  id: string
}

export type AuditLogSlice = {
  mainAuditLogList?: AuditLogPanelList
  secondaryAuditLogList?: AuditLogPanelList
  mainAuditLogDetails?: AuditLogPanelDetails
  secondaryAuditLogDetails?: AuditLogPanelDetails
}

export const initialState: AuditLogSlice = {}

const auditLogSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {
    mainPanelAuditLogDetailsUpdated(state, action: PayloadAction<string>) {
      const auditLogID = action.payload
      state.mainAuditLogDetails = {id: auditLogID}
    },
    secondaryPanelAuditLogDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const auditLogID = action.payload

      if (auditLogID) {
        state.secondaryAuditLogDetails = {id: auditLogID}
      } else {
        state.secondaryAuditLogDetails = undefined
      }
    },
    auditLogTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        timestampFilterValue?: TimestampFilterType
        tableNameFilterValue?: Array<string>
        operationFilterValue?: Array<AuditOperation>
        usernameFilterValue?: Array<string>
        freeTextFilterValue?: string
      }>
    ) {
      const {
        mode,
        tableNameFilterValue,
        operationFilterValue,
        timestampFilterValue,
        usernameFilterValue,
        freeTextFilterValue
      } = action.payload
      if (mode == "main") {
        state.mainAuditLogList = {
          ...state.mainAuditLogList,
          tableNameFilterValue,
          operationFilterValue,
          timestampFilterValue,
          usernameFilterValue,
          freeTextFilterValue
        }
        return
      }

      state.secondaryAuditLogList = {
        ...state.secondaryAuditLogList,
        tableNameFilterValue,
        operationFilterValue,
        timestampFilterValue,
        usernameFilterValue,
        freeTextFilterValue
      }
    },
    auditLogPaginationUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Pagination}>
    ) {
      const {mode, value} = action.payload
      // initialize `newValue` with whatever is in current state
      // i.e. depending on the `mode`, use value from `mainAuditLog` or from
      // `secondaryAuditLog`
      let newValue: Pagination = {
        pageSize:
          mode == "main"
            ? state.mainAuditLogList?.pageSize
            : state.secondaryAuditLogList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainAuditLogList?.pageSize
            : state.secondaryAuditLogList?.pageSize
      }
      // if non empty value received as parameter - use it
      // to update the state
      if (value.pageNumber) {
        newValue.pageNumber = value.pageNumber
      }

      if (value.pageSize) {
        newValue.pageSize = value.pageSize
      }

      if (mode == "main") {
        state.mainAuditLogList = {
          ...state.mainAuditLogList,
          ...newValue
        }
        return
      }

      state.secondaryAuditLogList = {
        ...state.secondaryAuditLogList,
        ...newValue
      }
    },
    auditLogPageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainAuditLogList = {
          ...state.mainAuditLogList,
          pageNumber: value
        }
        return
      }

      state.secondaryAuditLogList = {
        ...state.secondaryAuditLogList,
        pageNumber: value
      }
    },
    auditLogSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainAuditLogList = {
          ...state.mainAuditLogList,
          sorting: value
        }
        return
      }

      state.secondaryAuditLogList = {
        ...state.secondaryAuditLogList,
        sorting: value
      }
    },
    auditLogVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainAuditLogList = {
          ...state.mainAuditLogList,
          visibleColumns: value
        }
        return
      }

      state.secondaryAuditLogList = {
        ...state.secondaryAuditLogList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelAuditLogDetailsUpdated,
  secondaryPanelAuditLogDetailsUpdated,
  auditLogTableFiltersUpdated,
  auditLogPaginationUpdated,
  auditLogPageNumberValueUpdated,
  auditLogSortingUpdated,
  auditLogVisibleColumnsUpdated
} = auditLogSlice.actions
export default auditLogSlice.reducer

export const selectAuditLogTimestampFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.timestampFilterValue
  }

  return state.auditLogs.secondaryAuditLogList?.timestampFilterValue
}

export const selectAuditLogOperationFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.operationFilterValue
  }

  return state.auditLogs.secondaryAuditLogList?.operationFilterValue
}

export const selectAuditLogTableNameFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.tableNameFilterValue
  }

  return state.auditLogs.secondaryAuditLogList?.tableNameFilterValue
}

export const selectAuditLogUsernameFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.usernameFilterValue
  }

  return state.auditLogs.secondaryAuditLogList?.usernameFilterValue
}

export const selectAuditLogFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.freeTextFilterValue
  }

  return state.auditLogs.secondaryAuditLogList?.freeTextFilterValue
}

export const selectAuditLogPageSize = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.pageSize
  }

  return state.auditLogs.secondaryAuditLogList?.pageSize
}

export const selectAuditLogPageNumber = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.pageNumber
  }

  return state.auditLogs.secondaryAuditLogList?.pageNumber
}

export const selectAuditLogSorting = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.sorting
  }

  return state.auditLogs.secondaryAuditLogList?.sorting
}

export const selectAuditLogDetailsID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogDetails?.id
  }

  return state.auditLogs.secondaryAuditLogDetails?.id
}

export const selectAuditLogVisibleColumns = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.auditLogs.mainAuditLogList?.visibleColumns
  }

  return state.auditLogs.secondaryAuditLogList?.visibleColumns
}
