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
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchTags.fulfilled, (state, action) => {
      tagsAdapter.setAll(state, action.payload.items)
      state.pagination = {
        numPages: action.payload.num_pages,
        pageNumber: action.payload.page_number,
        pageSize: action.payload.page_size
      }
      state.lastPageSize = action.payload.page_size
    })
    builder.addCase(fetchTag.fulfilled, (state, action) => {
      const newGroup = action.payload
      const newGroupID = action.payload.id
      state.entities[newGroupID] = newGroup
    })
    builder.addCase(addTag.fulfilled, tagsAdapter.addOne)
    builder.addCase(updateTag.fulfilled, (state, action) => {
      const group = action.payload
      state.entities[group.id] = group
    })
    builder.addCase(removeTags.fulfilled, tagsAdapter.removeMany)
  }
})

type fetchTagsArgs = {
  pageNumber?: number
  pageSize?: number
}

export const fetchTags = createAsyncThunk<Paginated<ColoredTag>, fetchTagsArgs>(
  "tags/fetchTags",
  async (args: fetchTagsArgs) => {
    const pageNumber = args.pageNumber || 1
    const pageSize = args.pageSize || INITIAL_PAGE_SIZE

    const response = await axios.get("/api/tags/", {
      params: {
        page_size: pageSize,
        page_number: pageNumber
      }
    })
    const data = response.data as Paginated<ColoredTag>
    return data
  }
)

export const fetchTag = createAsyncThunk<ColoredTag, string>(
  "tags/fetchTag",
  async (tagId: string) => {
    const response = await axios.get(`/api/tags/${tagId}`)
    const data = response.data as ColoredTag
    return data
  }
)

export const addTag = createAsyncThunk<ColoredTag, NewColoredTag>(
  "tags/addTag",
  async (newTag: NewColoredTag) => {
    const response = await axios.post("/api/tags/", newTag)
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

export const removeTags = createAsyncThunk<string[], string[]>(
  "tags/removeTag",
  async (tagIds: string[]) => {
    await Promise.all(
      tagIds.map(tid => {
        axios.delete(`/api/tags/${tid}`)
      })
    )

    return tagIds
  }
)

export const {selectionAdd, selectionAddMany, selectionRemove, clearSelection} =
  tagsSlice.actions
export default tagsSlice.reducer

export const {selectAll: selectAllTags} = tagsAdapter.getSelectors<RootState>(
  state => state.tags
)

export const selectAllGroupsStatus = (state: RootState): SliceStateStatus =>
  state.groups.status

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

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.tags.pagination
}

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
