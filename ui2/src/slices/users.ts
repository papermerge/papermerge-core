import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction
} from "@reduxjs/toolkit"
import axios from "@/httpClient"
import {apiSlice} from "@/features/api/slice"

import {RootState} from "@/app/types"
import type {
  CreateUser,
  User,
  UserDetails,
  Paginated,
  PaginationType
} from "@/types"
import type {SliceStateStatus, SliceStateError} from "@/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export type ExtraStateType = {
  status: SliceStateStatus
  error: SliceStateError
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

export const extraState: ExtraStateType = {
  status: "idle",
  error: null,
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}

const usersAdapter = createEntityAdapter({
  selectId: (user: User) => user.id,
  sortComparer: (u1, u2) => u1.username.localeCompare(u2.username)
})

const initialState = usersAdapter.getInitialState(extraState)

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
      apiSlice.endpoints.getPaginatedUsers.matchFulfilled,
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

type UserUpdateFields = {
  id: string
  username: string
  email: string
  is_superuser: boolean
  is_active: boolean
  group_ids: number[]
}

export const updateUser = createAsyncThunk<UserDetails, UserUpdateFields>(
  "users/updateUser",
  async (user: UserUpdateFields) => {
    const response = await axios.patch(`/api/users/${user.id}`, user)
    const data = response.data as UserDetails
    return data
  }
)

export const {
  selectionAdd,
  selectionAddMany,
  selectionRemove,
  clearSelection,
  lastPageSizeUpdate
} = usersSlice.actions
export default usersSlice.reducer

export const {selectAll: selectAllUsers} = usersAdapter.getSelectors<RootState>(
  state => state.users
)

export const selectSelectedIds = (state: RootState) => state.users.selectedIds
export const selectUserById = (state: RootState, userId?: string) => {
  if (userId) {
    return state.users.entities[userId]
  }

  return null
}
export const selectUsersByIds = (state: RootState, userIds: string[]) => {
  return Object.values(state.users.entities).filter((u: User) =>
    userIds.includes(u.id)
  )
}

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.users.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.users.lastPageSize
}
