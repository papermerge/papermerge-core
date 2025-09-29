import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {t} from "i18next"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithTags} from "./api"

interface TagPanelList extends PanelListBase {
  selectedIDs?: Array<string>
  withUsersFilterValue?: Array<string>
  withoutUsersFilterValue?: Array<string>
  freeTextFilterValue?: string
}

interface TagPanelDetails {
  id: string
  freeTextFilterValue?: string
}

export type TagSlice = {
  mainTagList?: TagPanelList
  secondaryTagList?: TagPanelList
  mainTagDetails?: TagPanelDetails
  secondaryTagDetails?: TagPanelDetails
}

export const initialState: TagSlice = {}

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    mainPanelTagDetailsUpdated(state, action: PayloadAction<string>) {
      const tagID = action.payload
      state.mainTagDetails = {id: tagID}
    },
    secondaryPanelTagDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const tagID = action.payload
      if (tagID) {
        state.secondaryTagDetails = {id: tagID}
      } else {
        state.secondaryTagDetails = undefined
      }
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey = mode === "main" ? "mainTagList" : "secondaryTagList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey = mode === "main" ? "mainTagList" : "secondaryTagList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    tagsTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
      }>
    ) {
      const {mode, freeTextFilterValue} = action.payload
      if (mode == "main") {
        state.mainTagList = {
          ...state.mainTagList,
          freeTextFilterValue
        }
        return
      }

      state.secondaryTagList = {
        ...state.secondaryTagList,
        freeTextFilterValue
      }
    },
    tagPaginationUpdated(
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
            ? state.mainTagList?.pageSize
            : state.secondaryTagList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainTagList?.pageSize
            : state.secondaryTagList?.pageSize
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
        state.mainTagList = {
          ...state.mainTagList,
          ...newValue
        }
        return
      }

      state.secondaryTagList = {
        ...state.secondaryTagList,
        ...newValue
      }
    },
    tagPageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainTagList = {
          ...state.mainTagList,
          pageNumber: value
        }
        return
      }

      state.secondaryTagList = {
        ...state.secondaryTagList,
        pageNumber: value
      }
    },
    tagListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainTagList = {
          ...state.mainTagList,
          sorting: value
        }
        return
      }

      state.secondaryTagList = {
        ...state.secondaryTagList,
        sorting: value
      }
    },
    tagListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainTagList = {
          ...state.mainTagList,
          visibleColumns: value
        }
        return
      }

      state.secondaryTagList = {
        ...state.secondaryTagList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelTagDetailsUpdated,
  secondaryPanelTagDetailsUpdated,
  tagPageNumberValueUpdated,
  tagPaginationUpdated,
  selectionSet,
  clearSelection,
  tagListSortingUpdated,
  tagListVisibleColumnsUpdated,
  tagsTableFiltersUpdated
} = tagsSlice.actions
export default tagsSlice.reducer

export const selectTagsResult = apiSliceWithTags.endpoints.getTags.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectTagsById = createSelector(
  [selectTagsResult, selectItemIds],
  (tagsData, tagIds) => {
    return tagsData.data?.filter(g => tagIds.includes(g.id))
  }
)

export const selectTagById = createSelector(
  [selectTagsResult, selectItemId],
  (tagsData, tagId) => {
    return tagsData.data?.find(g => tagId == g.id)
  }
)

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.tags.mainTagList?.selectedIDs
  }

  return state.tags.secondaryTagList?.selectedIDs
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.tags.mainTagList?.pageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.tags.secondaryTagList?.pageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectTagPageSize = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.tags.mainTagList?.pageSize
  }

  return state.tags.secondaryTagList?.pageSize
}

export const selectTagPageNumber = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.tags.mainTagList?.pageNumber
  }

  return state.tags.secondaryTagList?.pageNumber
}
export const selectTagSorting = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.tags.mainTagList?.sorting
  }

  return state.tags.secondaryTagList?.sorting
}

export const selectTagDetailsID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.tags.mainTagDetails?.id
  }

  return state.tags.secondaryTagDetails?.id
}

export const selectTagVisibleColumns = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.tags.mainTagList?.visibleColumns
  }

  return state.tags.secondaryTagList?.visibleColumns
}

export const selectTagFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.tags.mainTagList?.freeTextFilterValue
  }

  return state.tags.secondaryTagList?.freeTextFilterValue
}

export const tagCRUDListeners = (startAppListening: AppStartListening) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithTags.endpoints.addNewTag.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithTags.endpoints.editTag.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.updated.success")
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher: apiSliceWithTags.endpoints.deleteTag.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.goup.deleted.success")
      })
    }
  })
}
