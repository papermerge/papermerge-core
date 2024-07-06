import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction
} from "@reduxjs/toolkit"
import axios from "@/httpClient"

import {RootState} from "@/app/types"
import type {NewGroup, Group, Paginated, PaginationType} from "@/types"
import type {SliceStateStatus, SliceStateError} from "@/types"
import {INITIAL_PAGE_SIZE} from "@/cconstants"

export type ExtraStateType = {
  status: SliceStateStatus
  error: SliceStateError
  selectedIds: Array<number>
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

const groupsAdapter = createEntityAdapter({
  selectId: (group: Group) => group.id,
  sortComparer: (g1, g2) => g1.name.localeCompare(g2.name)
})

const initialState = groupsAdapter.getInitialState(extraState)

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    selectionAdd: (state, action: PayloadAction<number>) => {
      state.selectedIds.push(action.payload)
    },
    selectionAddMany: (state, action: PayloadAction<Array<number>>) => {
      state.selectedIds = action.payload
    },
    selectionRemove: (state, action: PayloadAction<number>) => {
      const newSelectedIds = state.selectedIds.filter(i => i != action.payload)
      state.selectedIds = newSelectedIds
    },
    clearSelection: state => {
      state.selectedIds = []
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchGroups.fulfilled, (state, action) => {
      groupsAdapter.setAll(state, action.payload.items)
      state.pagination = {
        numPages: action.payload.num_pages,
        pageNumber: action.payload.page_number,
        pageSize: action.payload.page_size
      }
      state.lastPageSize = action.payload.page_size
    })
    builder.addCase(fetchGroup.fulfilled, (state, action) => {
      const newGroup = action.payload
      const newGroupID = action.payload.id
      state.entities[newGroupID] = newGroup
    })
    builder.addCase(addGroup.fulfilled, groupsAdapter.addOne)
    builder.addCase(updateGroup.fulfilled, (state, action) => {
      const group = action.payload
      state.entities[group.id] = group
    })
    builder.addCase(removeGroups.fulfilled, groupsAdapter.removeMany)
  }
})

type fetchGroupsArgs = {
  pageNumber?: number
  pageSize?: number
}

export const fetchGroups = createAsyncThunk<Paginated<Group>, fetchGroupsArgs>(
  "groups/fetchGroups",
  async (args: fetchGroupsArgs) => {
    const pageNumber = args.pageNumber || 1
    const pageSize = args.pageSize || INITIAL_PAGE_SIZE

    const response = await axios.get("/api/groups/", {
      params: {
        page_size: pageSize,
        page_number: pageNumber
      }
    })
    const data = response.data as Paginated<Group>
    return data
  }
)

export const fetchGroup = createAsyncThunk<Group, number>(
  "groups/fetchGroup",
  async (groupId: number) => {
    const response = await axios.get(`/api/groups/${groupId}`)
    const data = response.data as Group
    return data
  }
)

export const addGroup = createAsyncThunk<Group, NewGroup>(
  "groups/addGroup",
  async (newGroup: NewGroup) => {
    const response = await axios.post("/api/groups/", newGroup)
    const data = response.data as Group
    return data
  }
)

export const updateGroup = createAsyncThunk<Group, Group>(
  "groups/updateGroup",
  async (group: Group) => {
    const response = await axios.patch(`/api/groups/${group.id}`, group)
    const data = response.data as Group
    return data
  }
)

export const removeGroups = createAsyncThunk<number[], number[]>(
  "groups/removeGroup",
  async (groupIds: number[]) => {
    await Promise.all(
      groupIds.map(gid => {
        axios.delete(`/api/groups/${gid}`)
      })
    )

    return groupIds
  }
)

export const {selectionAdd, selectionAddMany, selectionRemove, clearSelection} =
  groupsSlice.actions
export default groupsSlice.reducer

export const {selectAll: selectAllGroups} =
  groupsAdapter.getSelectors<RootState>(state => state.groups)

export const selectAllGroupsStatus = (state: RootState): SliceStateStatus =>
  state.groups.status

export const selectSelectedIds = (state: RootState) => state.groups.selectedIds
export const selectGroupById = (state: RootState, groupId?: number) => {
  if (groupId) {
    return state.groups.entities[groupId]
  }

  return null
}
export const selectGroupsByIds = (state: RootState, groupIds: number[]) => {
  return Object.values(state.groups.entities).filter((g: Group) =>
    groupIds.includes(g.id)
  )
}

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.groups.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.groups.lastPageSize
}
