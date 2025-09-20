import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithUsers} from "./api"

import {RootState} from "@/app/types"

interface UserPanelList extends PanelListBase {
  selectedIDs?: Array<string>
  withRolesFilterValue?: Array<string>
  withoutRolesFilterValue?: Array<string>
  withGroupsFilterValue?: Array<string>
  withoutGroupsFilterValue?: Array<string>
  withScopesFilterValue?: Array<string>
  withoutScopesFilterValue?: Array<string>
}

interface UserPanelDetails {
  id: string
}

export type UserSlice = {
  mainUserList?: UserPanelList
  secondaryUserList?: UserPanelList
  mainUserDetails?: UserPanelDetails
  secondaryUserDetails?: UserPanelDetails
}

export const initialState: UserSlice = {}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    mainPanelUserDetailsUpdated(state, action: PayloadAction<string>) {
      const userID = action.payload
      state.mainUserDetails = {id: userID}
    },
    secondaryPanelUserDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const userID = action.payload

      if (userID) {
        state.secondaryUserDetails = {id: userID}
      } else {
        state.secondaryUserDetails = undefined
      }
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey = mode === "main" ? "mainUserList" : "secondaryUserList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey = mode === "main" ? "mainUserList" : "secondaryUserList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    usersTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
        withRolesFilterValue?: string[]
        withoutRolesFilterValue?: string[]
        withGroupsFilterValue?: string[]
        withoutGroupsFilterValue?: string[]
        withScopesFilterValue?: string[]
        withoutScopesFilterValue?: string[]
      }>
    ) {
      const {
        mode,
        freeTextFilterValue,
        withRolesFilterValue,
        withoutRolesFilterValue,
        withGroupsFilterValue,
        withoutGroupsFilterValue,
        withScopesFilterValue,
        withoutScopesFilterValue
      } = action.payload
      if (mode == "main") {
        state.mainUserList = {
          ...state.mainUserList,
          freeTextFilterValue,
          withRolesFilterValue,
          withoutRolesFilterValue,
          withGroupsFilterValue,
          withoutGroupsFilterValue,
          withScopesFilterValue,
          withoutScopesFilterValue
        }
        return
      }

      state.secondaryUserList = {
        ...state.secondaryUserList,
        freeTextFilterValue,
        withRolesFilterValue,
        withoutRolesFilterValue,
        withGroupsFilterValue,
        withoutGroupsFilterValue,
        withScopesFilterValue,
        withoutScopesFilterValue
      }
    },
    userPaginationUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Pagination}>
    ) {
      const {mode, value} = action.payload
      let newValue: Pagination = {
        pageSize:
          mode == "main"
            ? state.mainUserList?.pageSize
            : state.secondaryUserList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainUserList?.pageSize
            : state.secondaryUserList?.pageSize
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
        state.mainUserList = {
          ...state.mainUserList,
          ...newValue
        }
        return
      }

      state.secondaryUserList = {
        ...state.secondaryUserList,
        ...newValue
      }
    },
    userPageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainUserList = {
          ...state.mainUserList,
          pageNumber: value
        }
        return
      }

      state.secondaryUserList = {
        ...state.secondaryUserList,
        pageNumber: value
      }
    },
    userListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainUserList = {
          ...state.mainUserList,
          sorting: value
        }
        return
      }

      state.secondaryUserList = {
        ...state.secondaryUserList,
        sorting: value
      }
    },
    userListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainUserList = {
          ...state.mainUserList,
          visibleColumns: value
        }
        return
      }

      state.secondaryUserList = {
        ...state.secondaryUserList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelUserDetailsUpdated,
  secondaryPanelUserDetailsUpdated,
  userPageNumberValueUpdated,
  userPaginationUpdated,
  selectionSet,
  clearSelection,
  userListSortingUpdated,
  userListVisibleColumnsUpdated,
  usersTableFiltersUpdated
} = usersSlice.actions
export default usersSlice.reducer

export const selectUsersResult = apiSliceWithUsers.endpoints.getUsers.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectUsersById = createSelector(
  [selectUsersResult, selectItemIds],
  (usersData, userIds) => {
    return usersData.data?.filter(u => userIds.includes(u.id))
  }
)

export const selectUserById = createSelector(
  [selectUsersResult, selectItemId],
  (usersData, userId) => {
    return usersData.data?.find(u => userId == u.id)
  }
)

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.users.mainUserList?.selectedIDs
  }

  return state.users.secondaryUserList?.selectedIDs
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.users.mainUserList?.pageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.users.secondaryUserList?.pageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectUserPageSize = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.users.mainUserList?.pageSize
  }

  return state.users.secondaryUserList?.pageSize
}

export const selectUserPageNumber = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.users.mainUserList?.pageNumber
  }

  return state.users.secondaryUserList?.pageNumber
}
export const selectUserSorting = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.users.mainUserList?.sorting
  }

  return state.users.secondaryUserList?.sorting
}

export const selectUserDetailsID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.users.mainUserDetails?.id
  }

  return state.users.secondaryUserDetails?.id
}

export const selectUserVisibleColumns = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.users.mainUserList?.visibleColumns
  }

  return state.users.secondaryUserList?.visibleColumns
}

export const selectUserFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.freeTextFilterValue
  }

  return state.users.secondaryUserList?.freeTextFilterValue
}

export const selectUserWithRolesFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.withRolesFilterValue
  }

  return state.users.secondaryUserList?.withRolesFilterValue
}

export const selectUserWithoutRolesFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.withoutRolesFilterValue
  }

  return state.users.secondaryUserList?.withoutRolesFilterValue
}

export const selectUserWithGroupsFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.withGroupsFilterValue
  }

  return state.users.secondaryUserList?.withGroupsFilterValue
}

export const selectWithoutGroupsFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.withoutGroupsFilterValue
  }

  return state.users.secondaryUserList?.withoutGroupsFilterValue
}

export const selectUserWithScopesFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.withGroupsFilterValue
  }

  return state.users.secondaryUserList?.withGroupsFilterValue
}

export const selectWithoutScopesFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.users.mainUserList?.withoutScopesFilterValue
  }

  return state.users.secondaryUserList?.withoutScopesFilterValue
}
