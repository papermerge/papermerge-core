import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction
} from "@reduxjs/toolkit"
import axios from "@/httpClient"

import {RootState} from "@/app/types"
import type {
  CreateUser,
  User,
  UserDetails,
  Paginated,
  PaginationType
} from "@/types"
import type {SliceStateStatus, SliceStateError} from "@/types"
import {INITIAL_PAGE_SIZE} from "@/cconstants"

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
  lastPageSize: INITIAL_PAGE_SIZE
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
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      usersAdapter.setAll(state, action.payload.items)
      state.pagination = {
        numPages: action.payload.num_pages,
        pageNumber: action.payload.page_number,
        pageSize: action.payload.page_size
      }
      state.lastPageSize = action.payload.page_size
    })
    builder.addCase(fetchUser.fulfilled, (state, action) => {
      const newUser = action.payload
      const newUserID = action.payload.id
      state.entities[newUserID] = newUser
    })
    builder.addCase(addUser.fulfilled, usersAdapter.addOne)
    builder.addCase(updateUser.fulfilled, (state, action) => {
      const group = action.payload
      state.entities[group.id] = group
    })
    builder.addCase(removeUsers.fulfilled, usersAdapter.removeMany)
  }
})

type fetchUsersArgs = {
  pageNumber?: number
  pageSize?: number
}

export const fetchUsers = createAsyncThunk<Paginated<User>, fetchUsersArgs>(
  "users/fetchUsers",
  async (args: fetchUsersArgs) => {
    const pageNumber = args.pageNumber || 1
    const pageSize = args.pageSize || INITIAL_PAGE_SIZE

    const response = await axios.get("/api/users/", {
      params: {
        page_size: pageSize,
        page_number: pageNumber
      }
    })
    const data = response.data as Paginated<User>
    return data
  }
)

export const fetchUser = createAsyncThunk<User, string>(
  "users/fetchUser",
  async (userId: string) => {
    const response = await axios.get(`/api/users/${userId}`)
    const data = response.data as User
    return data
  }
)

export const addUser = createAsyncThunk<User, CreateUser>(
  "users/addUser",
  async (newUser: CreateUser) => {
    const response = await axios.post("/api/users/", newUser)
    const data = response.data as User
    return data
  }
)

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

export const removeUsers = createAsyncThunk<string[], string[]>(
  "users/removeUser",
  async (userIds: string[]) => {
    await Promise.all(
      userIds.map(uid => {
        axios.delete(`/api/users/${uid}`)
      })
    )

    return userIds
  }
)

export const {selectionAdd, selectionAddMany, selectionRemove, clearSelection} =
  usersSlice.actions
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
