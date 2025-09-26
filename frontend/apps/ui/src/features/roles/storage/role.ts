import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode, ServerErrorType} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {t} from "i18next"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithRoles} from "./api"

interface RolePanelList extends PanelListBase {
  selectedIDs?: Array<string>
  freeTextFilterValue?: string
  includeScopeFilterValue?: Array<string>
  excludeScopeFilterValue?: Array<string>
}

interface RolePanelDetails {
  id: string
}

export type RoleSlice = {
  mainRoleList?: RolePanelList
  secondaryRoleList?: RolePanelList
  mainRoleDetails?: RolePanelDetails
  secondaryRoleDetails?: RolePanelDetails
  mainRoleFormExpandedNodes?: string[]
  secondaryRoleFormExpandedNodes?: string[]
}

export const initialState: RoleSlice = {
  mainRoleFormExpandedNodes: [],
  secondaryRoleFormExpandedNodes: []
}

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    mainPanelRoleDetailsUpdated(state, action: PayloadAction<string>) {
      const roleID = action.payload
      state.mainRoleDetails = {id: roleID}
    },
    secondaryPanelRoleDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const roleID = action.payload

      if (roleID) {
        state.secondaryRoleDetails = {id: roleID}
      } else {
        state.secondaryRoleDetails = undefined
      }
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey = mode === "main" ? "mainRoleList" : "secondaryRoleList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey = mode === "main" ? "mainRoleList" : "secondaryRoleList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    rolesTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
        includeScopeFilterValue?: string[]
        excludeScopeFilterValue?: string[]
      }>
    ) {
      const {
        mode,
        freeTextFilterValue,
        includeScopeFilterValue,
        excludeScopeFilterValue
      } = action.payload
      if (mode == "main") {
        state.mainRoleList = {
          ...state.mainRoleList,
          freeTextFilterValue,
          includeScopeFilterValue,
          excludeScopeFilterValue
        }
        return
      }

      state.secondaryRoleList = {
        ...state.secondaryRoleList,
        freeTextFilterValue,
        includeScopeFilterValue,
        excludeScopeFilterValue
      }
    },
    rolePaginationUpdated(
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
            ? state.mainRoleList?.pageSize
            : state.secondaryRoleList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainRoleList?.pageSize
            : state.secondaryRoleList?.pageSize
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
        state.mainRoleList = {
          ...state.mainRoleList,
          ...newValue
        }
        return
      }

      state.secondaryRoleList = {
        ...state.secondaryRoleList,
        ...newValue
      }
    },
    rolePageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainRoleList = {
          ...state.mainRoleList,
          pageNumber: value
        }
        return
      }

      state.secondaryRoleList = {
        ...state.secondaryRoleList,
        pageNumber: value
      }
    },
    roleListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainRoleList = {
          ...state.mainRoleList,
          sorting: value
        }
        return
      }

      state.secondaryRoleList = {
        ...state.secondaryRoleList,
        sorting: value
      }
    },
    roleListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainRoleList = {
          ...state.mainRoleList,
          visibleColumns: value
        }
        return
      }

      state.secondaryRoleList = {
        ...state.secondaryRoleList,
        visibleColumns: value
      }
    },
    setRoleFormExpandedNodes: (
      state,
      action: PayloadAction<{
        mode: PanelMode
        expandedNodes: string[]
      }>
    ) => {
      const {mode, expandedNodes} = action.payload

      if (mode === "main") {
        state.mainRoleFormExpandedNodes = expandedNodes
      } else {
        state.secondaryRoleFormExpandedNodes = expandedNodes
      }
    },
    clearRoleFormExpandedNodes: (
      state,
      action: PayloadAction<{mode: PanelMode}>
    ) => {
      const {mode} = action.payload

      if (mode === "main") {
        state.mainRoleFormExpandedNodes = []
      } else {
        state.secondaryRoleFormExpandedNodes = []
      }
    }
  }
})

export const {
  mainPanelRoleDetailsUpdated,
  secondaryPanelRoleDetailsUpdated,
  rolePageNumberValueUpdated,
  rolePaginationUpdated,
  selectionSet,
  clearSelection,
  roleListSortingUpdated,
  roleListVisibleColumnsUpdated,
  rolesTableFiltersUpdated,
  setRoleFormExpandedNodes,
  clearRoleFormExpandedNodes
} = rolesSlice.actions
export default rolesSlice.reducer

export const selectRolesResult = apiSliceWithRoles.endpoints.getRoles.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectRolesById = createSelector(
  [selectRolesResult, selectItemIds],
  (rolesData, roleIds) => {
    return rolesData.data?.filter(g => roleIds.includes(g.id))
  }
)

export const selectRoleById = createSelector(
  [selectRolesResult, selectItemId],
  (rolesData, roleId) => {
    return rolesData.data?.find(g => roleId == g.id)
  }
)

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.selectedIDs
  }

  return state.roles.secondaryRoleList?.selectedIDs
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.roles.mainRoleList?.pageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.roles.secondaryRoleList?.pageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectRolePageSize = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.pageSize
  }

  return state.roles.secondaryRoleList?.pageSize
}

export const selectRolePageNumber = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.pageNumber
  }

  return state.roles.secondaryRoleList?.pageNumber
}
export const selectRoleSorting = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.sorting
  }

  return state.roles.secondaryRoleList?.sorting
}

export const selectRoleDetailsID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.roles.mainRoleDetails?.id
  }

  return state.roles.secondaryRoleDetails?.id
}

export const selectRoleVisibleColumns = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.visibleColumns
  }

  return state.roles.secondaryRoleList?.visibleColumns
}

export const selectRoleFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.freeTextFilterValue
  }

  return state.roles.secondaryRoleList?.freeTextFilterValue
}

export const selectRoleIncludeScopeFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.includeScopeFilterValue
  }

  return state.roles.secondaryRoleList?.includeScopeFilterValue
}

export const selectRoleExcludeScopeFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.roles.mainRoleList?.excludeScopeFilterValue
  }

  return state.roles.secondaryRoleList?.excludeScopeFilterValue
}

export const selectRoleFormExpandedNodes = (
  state: RootState,
  mode: PanelMode
): string[] => {
  if (mode === "main") {
    return state.roles.mainRoleFormExpandedNodes || []
  }

  return state.roles.secondaryRoleFormExpandedNodes || []
}

export const roleCRUDListeners = (startAppListening: AppStartListening) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.addNewRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.editRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.updated.success")
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.editRole.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.deleteRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.deleted.success")
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.deleteRole.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
}
