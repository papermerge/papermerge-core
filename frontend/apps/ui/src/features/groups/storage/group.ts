import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode, ServerErrorType} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {t} from "i18next"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithGroups} from "./api"

interface GroupPanelList extends PanelListBase {
  selectedIDs?: Array<string>
  withUsersFilterValue?: Array<string>
  withoutUsersFilterValue?: Array<string>
}

interface GroupPanelDetails {
  id: string
}

export type GroupSlice = {
  mainGroupList?: GroupPanelList
  secondaryGroupList?: GroupPanelList
  mainGroupDetails?: GroupPanelDetails
  secondaryGroupDetails?: GroupPanelDetails
}

export const initialState: GroupSlice = {}

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    mainPanelGroupDetailsUpdated(state, action: PayloadAction<string>) {
      const groupID = action.payload
      state.mainGroupDetails = {id: groupID}
    },
    secondaryPanelGroupDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const groupID = action.payload
      if (groupID) {
        state.secondaryGroupDetails = {id: groupID}
      } else {
        state.secondaryGroupDetails = undefined
      }
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey = mode === "main" ? "mainGroupList" : "secondaryGroupList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey = mode === "main" ? "mainGroupList" : "secondaryGroupList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    groupsTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
        withUsersFilterValue?: string[]
        withoutUsersFilterValue?: string[]
      }>
    ) {
      const {
        mode,
        freeTextFilterValue,
        withUsersFilterValue,
        withoutUsersFilterValue
      } = action.payload
      if (mode == "main") {
        state.mainGroupList = {
          ...state.mainGroupList,
          freeTextFilterValue,
          withUsersFilterValue,
          withoutUsersFilterValue
        }
        return
      }

      state.secondaryGroupList = {
        ...state.secondaryGroupList,
        freeTextFilterValue,
        withUsersFilterValue,
        withoutUsersFilterValue
      }
    },
    groupPaginationUpdated(
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
            ? state.mainGroupList?.pageSize
            : state.secondaryGroupList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainGroupList?.pageSize
            : state.secondaryGroupList?.pageSize
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
        state.mainGroupList = {
          ...state.mainGroupList,
          ...newValue
        }
        return
      }

      state.secondaryGroupList = {
        ...state.secondaryGroupList,
        ...newValue
      }
    },
    groupPageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainGroupList = {
          ...state.mainGroupList,
          pageNumber: value
        }
        return
      }

      state.secondaryGroupList = {
        ...state.secondaryGroupList,
        pageNumber: value
      }
    },
    groupListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainGroupList = {
          ...state.mainGroupList,
          sorting: value
        }
        return
      }

      state.secondaryGroupList = {
        ...state.secondaryGroupList,
        sorting: value
      }
    },
    groupListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainGroupList = {
          ...state.mainGroupList,
          visibleColumns: value
        }
        return
      }

      state.secondaryGroupList = {
        ...state.secondaryGroupList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelGroupDetailsUpdated,
  secondaryPanelGroupDetailsUpdated,
  groupPageNumberValueUpdated,
  groupPaginationUpdated,
  selectionSet,
  clearSelection,
  groupListSortingUpdated,
  groupListVisibleColumnsUpdated,
  groupsTableFiltersUpdated
} = groupsSlice.actions
export default groupsSlice.reducer

export const selectGroupsResult =
  apiSliceWithGroups.endpoints.getGroups.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectGroupsById = createSelector(
  [selectGroupsResult, selectItemIds],
  (groupsData, groupIds) => {
    return groupsData.data?.filter(g => groupIds.includes(g.id))
  }
)

export const selectGroupById = createSelector(
  [selectGroupsResult, selectItemId],
  (groupsData, groupId) => {
    return groupsData.data?.find(g => groupId == g.id)
  }
)

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.selectedIDs
  }

  return state.groups.secondaryGroupList?.selectedIDs
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.groups.mainGroupList?.pageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.groups.secondaryGroupList?.pageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectGroupPageSize = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.pageSize
  }

  return state.groups.secondaryGroupList?.pageSize
}

export const selectGroupPageNumber = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.pageNumber
  }

  return state.groups.secondaryGroupList?.pageNumber
}
export const selectGroupSorting = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.sorting
  }

  return state.groups.secondaryGroupList?.sorting
}

export const selectGroupDetailsID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.groups.mainGroupDetails?.id
  }

  return state.groups.secondaryGroupDetails?.id
}

export const selectGroupVisibleColumns = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.visibleColumns
  }

  return state.groups.secondaryGroupList?.visibleColumns
}

export const selectGroupFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.freeTextFilterValue
  }

  return state.groups.secondaryGroupList?.freeTextFilterValue
}

export const selectGroupWithUsersFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.withUsersFilterValue
  }

  return state.groups.secondaryGroupList?.withUsersFilterValue
}

export const selectGroupWithoutUsersFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.groups.mainGroupList?.withoutUsersFilterValue
  }

  return state.groups.secondaryGroupList?.withoutUsersFilterValue
}

export const groupCRUDListeners = (startAppListening: AppStartListening) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.addNewGroup.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.editGroup.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.updated.success")
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.editGroup.matchRejected,
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
    matcher: apiSliceWithGroups.endpoints.deleteGroup.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.deleted.success")
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher: apiSliceWithGroups.endpoints.deleteGroup.matchRejected,
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
