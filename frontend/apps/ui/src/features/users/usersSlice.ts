import {createSlice, PayloadAction, createSelector} from "@reduxjs/toolkit"

import {apiSliceWithUsers} from "./apiSlice"

import {RootState} from "@/app/types"
import type {User, Paginated, PaginationType} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export type UserSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

export const initialState: UserSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    selectionAdd: (state, action: PayloadAction<string>) => {
      state.selectedIds.push(action.payload)
    },
    selectionAddMany: (state, action: PayloadAction<Array<string>>) => {
      state.selectedIds = action.payload
    },
    selectionRemove: (state, action: PayloadAction<string>) => {
      const newSelectedIds = state.selectedIds.filter(i => i != action.payload)
      state.selectedIds = newSelectedIds
    },
    clearSelection: state => {
      state.selectedIds = []
    },
    lastPageSizeUpdate: (state, action: PayloadAction<number>) => {
      state.lastPageSize = action.payload
    }
  },
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithUsers.endpoints.getPaginatedUsers.matchFulfilled,
      (state, action) => {
        const payload: Paginated<User> = action.payload
        state.pagination = {
          pageNumber: payload.page_number,
          pageSize: payload.page_size,
          numPages: payload.num_pages
        }
        state.lastPageSize = payload.page_size
      }
    )
  }
})

export const {
  selectionAdd,
  selectionAddMany,
  selectionRemove,
  clearSelection,
  lastPageSizeUpdate
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

export const selectSelectedIds = (state: RootState) => state.users.selectedIds

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.users.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.users.lastPageSize
}
