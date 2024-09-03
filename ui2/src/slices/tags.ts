import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction,
  createSelector
} from "@reduxjs/toolkit"
import axios from "@/httpClient"

import {RootState} from "@/app/types"
import type {
  ColoredTagType,
  NewColoredTag,
  ColoredTag,
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

const tagsAdapter = createEntityAdapter({
  selectId: (tag: ColoredTag) => tag.id,
  sortComparer: (t1, t2) => t1.name.localeCompare(t2.name)
})

const initialState = tagsAdapter.getInitialState(extraState)

const tagsSlice = createSlice({
  name: "tags",
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
    builder.addCase(updateTag.fulfilled, (state, action) => {
      const group = action.payload
      state.entities[group.id] = group
    })
  }
})

export const fetchTag = createAsyncThunk<ColoredTag, string>(
  "tags/fetchTag",
  async (tagId: string) => {
    const response = await axios.get(`/api/tags/${tagId}`)
    const data = response.data as ColoredTag
    return data
  }
)

export const updateTag = createAsyncThunk<ColoredTag, ColoredTag>(
  "tags/updateTag",
  async (tag: ColoredTagType) => {
    const response = await axios.patch(`/api/tags/${tag.id}`, tag)
    const data = response.data as ColoredTag
    return data
  }
)

export const {
  selectionAdd,
  selectionAddMany,
  selectionRemove,
  clearSelection,
  lastPageSizeUpdate
} = tagsSlice.actions
export default tagsSlice.reducer

export const {selectAll: selectAllTags} = tagsAdapter.getSelectors<RootState>(
  state => state.tags
)

export const selectSelectedIds = (state: RootState) => state.tags.selectedIds
export const selectTagById = (state: RootState, tagId?: string) => {
  if (tagId) {
    return state.tags.entities[tagId]
  }

  return null
}

export const selectTagEntities = (
  state: RootState
): Record<string, ColoredTagType> => {
  return state.tags.entities
}

// @ts-ignore
export const selectItemNames = (state: RootState, names: string[]) => names
// @ts-ignore
export const selectItemIds = (state: RootState, itemIds: string[]) => itemIds

export const selectTagsByName = createSelector(
  [selectTagEntities, selectItemNames],
  (tags: Record<string, ColoredTagType>, names: Array<string>) => {
    const allTags = Object.values(tags)
    return allTags.filter(t => names.includes(t.name))
  }
)

export const selectLastPageSize = (state: RootState): number => {
  return state.tags.lastPageSize
}

export const selectTagsByIds = createSelector(
  [selectTagEntities, selectItemIds],
  (tags: Record<string, ColoredTagType>, itemIds: Array<string>) => {
    const allTags = Object.values(tags)
    return allTags.filter(t => itemIds.includes(t.id))
  }
)
