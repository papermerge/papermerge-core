import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {PanelMode} from "@/types"
import type {PanelListBase} from "@/types.d/panel"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {skipToken} from "@reduxjs/toolkit/query"
import type {Pagination, SortState} from "kommon"
import {apiSliceWithDocumentsByCategory} from "./api"

interface DocumentsByCategoryPanelList extends PanelListBase {
  selectedIDs?: Array<string>
  freeTextFilterValue?: string
  includeScopeFilterValue?: Array<string>
  excludeScopeFilterValue?: Array<string>
}

interface DocumentsByCategoryPanelDetails {
  document_id: string // document ID
}

export type DocumentsByCategorySlice = {
  mainDocumentsByCategoryList?: DocumentsByCategoryPanelList
  secondaryDocumentsByCategoryList?: DocumentsByCategoryPanelList
  mainDocumentsByCategoryDetails?: DocumentsByCategoryPanelDetails
  secondaryDocumentsByCategoryDetails?: DocumentsByCategoryPanelDetails
  mainCategoryID?: string // category ID  = document type ID
  secondaryCategoryID?: string // category ID  = document type ID
}

export const initialState: DocumentsByCategorySlice = {}

const documentsByCategorySlice = createSlice({
  name: "documentsByCategory",
  initialState,
  reducers: {
    mainPanelDocumentsByCategoryDetailsUpdated(
      state,
      action: PayloadAction<string>
    ) {
      const documentID = action.payload
      state.mainDocumentsByCategoryDetails = {document_id: documentID}
    },
    secondaryPanelDocumentsByCategoryDetailsUpdated(
      state,
      action: PayloadAction<string | undefined>
    ) {
      const documentID = action.payload

      if (documentID) {
        state.secondaryDocumentsByCategoryDetails = {document_id: documentID}
      } else {
        state.secondaryDocumentsByCategoryDetails = undefined
      }
    },
    documentCategoryIDUpdated: (
      state,
      action: PayloadAction<{
        id?: string
        mode: PanelMode
      }>
    ) => {
      const {mode, id} = action.payload
      const key = mode === "main" ? "mainCategoryID" : "secondaryCategoryID"

      state[key] = id
    },
    selectionSet: (
      state,
      action: PayloadAction<{ids: string[]; mode: PanelMode}>
    ) => {
      const {mode, ids} = action.payload
      const listKey =
        mode === "main"
          ? "mainDocumentsByCategoryList"
          : "secondaryDocumentsByCategoryList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: ids
      }
    },
    clearSelection: (state, action: PayloadAction<{mode: PanelMode}>) => {
      const {mode} = action.payload
      const listKey =
        mode === "main"
          ? "mainDocumentsByCategoryList"
          : "secondaryDocumentsByCategoryList"

      const existingList = state[listKey]

      state[listKey] = {
        ...existingList,
        selectedIDs: []
      }
    },
    documentsByCategoryTableFiltersUpdated(
      state,
      action: PayloadAction<{
        mode: PanelMode
        freeTextFilterValue?: string
        includeScopeFilterValue?: string[]
        excludeScopeFilterValue?: string[]
      }>
    ) {
      const {
        mode,
        freeTextFilterValue,
        includeScopeFilterValue,
        excludeScopeFilterValue
      } = action.payload
      if (mode == "main") {
        state.mainDocumentsByCategoryList = {
          ...state.mainDocumentsByCategoryList,
          freeTextFilterValue,
          includeScopeFilterValue,
          excludeScopeFilterValue
        }
        return
      }

      state.secondaryDocumentsByCategoryList = {
        ...state.secondaryDocumentsByCategoryList,
        freeTextFilterValue,
        includeScopeFilterValue,
        excludeScopeFilterValue
      }
    },
    rolePaginationUpdated(
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
            ? state.mainDocumentsByCategoryList?.pageSize
            : state.secondaryDocumentsByCategoryList?.pageSize,
        pageNumber:
          mode == "main"
            ? state.mainDocumentsByCategoryList?.pageSize
            : state.secondaryDocumentsByCategoryList?.pageSize
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
        state.mainDocumentsByCategoryList = {
          ...state.mainDocumentsByCategoryList,
          ...newValue
        }
        return
      }

      state.secondaryDocumentsByCategoryList = {
        ...state.secondaryDocumentsByCategoryList,
        ...newValue
      }
    },
    rolePageNumberValueUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: number}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainDocumentsByCategoryList = {
          ...state.mainDocumentsByCategoryList,
          pageNumber: value
        }
        return
      }

      state.secondaryDocumentsByCategoryList = {
        ...state.secondaryDocumentsByCategoryList,
        pageNumber: value
      }
    },
    roleListSortingUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: SortState}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainDocumentsByCategoryList = {
          ...state.mainDocumentsByCategoryList,
          sorting: value
        }
        return
      }

      state.secondaryDocumentsByCategoryList = {
        ...state.secondaryDocumentsByCategoryList,
        sorting: value
      }
    },
    roleListVisibleColumnsUpdated(
      state,
      action: PayloadAction<{mode: PanelMode; value: Array<string>}>
    ) {
      const {mode, value} = action.payload
      if (mode == "main") {
        state.mainDocumentsByCategoryList = {
          ...state.mainDocumentsByCategoryList,
          visibleColumns: value
        }
        return
      }

      state.secondaryDocumentsByCategoryList = {
        ...state.secondaryDocumentsByCategoryList,
        visibleColumns: value
      }
    }
  }
})

export const {
  mainPanelDocumentsByCategoryDetailsUpdated,
  secondaryPanelDocumentsByCategoryDetailsUpdated,
  documentCategoryIDUpdated,
  rolePageNumberValueUpdated,
  rolePaginationUpdated,
  selectionSet,
  clearSelection,
  roleListSortingUpdated,
  roleListVisibleColumnsUpdated,
  documentsByCategoryTableFiltersUpdated
} = documentsByCategorySlice.actions
export default documentsByCategorySlice.reducer

export const selectDocumentsByCategorysResult =
  apiSliceWithDocumentsByCategory.endpoints.getPaginatedDocumentsByCategory.select(
    skipToken
  )
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectSelectedIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList?.selectedIDs
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList?.selectedIDs
}

export const selectDocumentCategoryID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.documentsByCategory.mainCategoryID
  }

  return state.documentsByCategory.secondaryCategoryID
}

export const selectPageSize = (state: RootState, mode: PanelMode): number => {
  if (mode == "main") {
    return (
      state.documentsByCategory.mainDocumentsByCategoryList?.pageSize ||
      PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.documentsByCategory.secondaryDocumentsByCategoryList?.pageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectDocumentsByCategoryPageSize = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList?.pageSize
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList?.pageSize
}

export const selectDocumentsByCategoryPageNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList?.pageNumber
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList?.pageNumber
}
export const selectDocumentsByCategorySorting = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList?.sorting
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList?.sorting
}

export const selectDocumentsByCategoryDetailsID = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryDetails?.document_id
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryDetails
    ?.document_id
}

export const selectDocumentsByCategoryVisibleColumns = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList?.visibleColumns
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList
    ?.visibleColumns
}

export const selectDocumentsByCategoryFreeTextFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList
      ?.freeTextFilterValue
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList
    ?.freeTextFilterValue
}

export const selectDocumentsByCategoryIncludeScopeFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList
      ?.includeScopeFilterValue
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList
    ?.includeScopeFilterValue
}

export const selectDocumentsByCategoryExcludeScopeFilterValue = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.documentsByCategory.mainDocumentsByCategoryList
      ?.excludeScopeFilterValue
  }

  return state.documentsByCategory.secondaryDocumentsByCategoryList
    ?.excludeScopeFilterValue
}
