import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction
} from "@reduxjs/toolkit"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import axios from "axios"

import {RootState} from "@/app/types"
import type {
  NewGroup,
  Group,
  Paginated,
  SliceStateStatus,
  SliceStateError
} from "@/types"

const groupsAdapter = createEntityAdapter({
  selectId: (group: Group) => group.id,
  sortComparer: (g1, g2) => g1.name.localeCompare(g2.name)
})

type ExtraStateType = {
  status: SliceStateStatus
  error: SliceStateError
  selectedIds: Array<number>
}

const extraState: ExtraStateType = {
  status: "idle",
  error: null,
  selectedIds: []
}

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
    builder.addCase(fetchGroups.fulfilled, groupsAdapter.setAll)
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

export const fetchGroups = createAsyncThunk("groups/fetchGroups", async () => {
  const rest_api_url = getRestAPIURL()
  const defaultHeaders = getDefaultHeaders()

  const response = await axios.get(`${rest_api_url}/api/groups/`, {
    headers: defaultHeaders
  })
  const data = response.data as Paginated<Group>
  return data.items
})

export const fetchGroup = createAsyncThunk<Group, number>(
  "groups/fetchGroup",
  async (groupId: number) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()

    const response = await axios.get(`${rest_api_url}/api/groups/${groupId}`, {
      headers: defaultHeaders
    })
    const data = response.data as Group
    return data
  }
)

export const addGroup = createAsyncThunk<Group, NewGroup>(
  "groups/addGroup",
  async (newGroup: NewGroup) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()

    const response = await axios.post(`${rest_api_url}/api/groups/`, newGroup, {
      headers: defaultHeaders
    })
    const data = response.data as Group
    return data
  }
)

export const updateGroup = createAsyncThunk<Group, Group>(
  "groups/updateGroup",
  async (group: Group) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()

    const response = await axios.patch(
      `${rest_api_url}/api/groups/${group.id}`,
      group,
      {
        headers: defaultHeaders
      }
    )
    const data = response.data as Group
    return data
  }
)

export const removeGroups = createAsyncThunk<number[], number[]>(
  "groups/removeGroup",
  async (groupIds: number[]) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()

    groupIds.forEach(gid => {
      axios.delete(`${rest_api_url}/api/groups/${gid}`, {
        headers: defaultHeaders
      })
    })

    return groupIds
  }
)

export const {selectionAdd, selectionAddMany, selectionRemove, clearSelection} =
  groupsSlice.actions
export default groupsSlice.reducer

export const {selectAll: selectAllGroups} =
  groupsAdapter.getSelectors<RootState>(state => state.groups)

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
