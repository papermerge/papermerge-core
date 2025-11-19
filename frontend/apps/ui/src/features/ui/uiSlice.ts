import type {RootState} from "@/app/types"
import {
  MAX_ZOOM_FACTOR,
  MIN_ZOOM_FACTOR,
  PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  ZOOM_FACTOR_INIT,
  ZOOM_FACTOR_STEP
} from "@/cconstants"
import type {
  BooleanString,
  CType,
  ClientPage,
  PanelMode,
  ViewOption
} from "@/types"
import type {PanelComponent} from "@/types.d/ui"
import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"
import Cookies from "js-cookie"

import type {
  FileItemStatus,
  FileItemType,
  NodeType,
  SortMenuColumn,
  SortMenuDirection
} from "@/types"

import type {AuditOperation, TimestampFilterType} from "@/features/audit/types"
import type {CategoryColumn} from "@/features/nodes/components/Commander/____DocumentsByTypeCommander/types"
import {DialogVisiblity} from "@/types.d/common"
import {SortState} from "kommon"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 200
const NAVBAR_COLLAPSED_COOKIE = "navbar_collapsed"
const NAVBAR_WIDTH_COOKIE = "navbar_width"
const MAIN_THUMBNAILS_PANEL_OPENED_COOKIE = "main_thumbnails_panel_opened"
const SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE =
  "secondary_thumbnails_panel_opened"
const MAIN_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE =
  "main_document_details_panel_opened"
const SECONDARY_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE =
  "secondary_document_details_panel_opened"

const SMALL_BOTTOM_MARGIN = 13 /* pixles */

type DualArg = {
  mode: PanelMode
  value: number
}

type UpdateFilterType = {
  mode: PanelMode
  filter?: string
}

type LastPageSizeArg = {
  mode: PanelMode
  pageSize: number
}

type CurrentDocVerUpdateArg = {
  mode: PanelMode
  docVerID: string | undefined
}

interface PanelSelectionArg {
  itemID: string
  mode: PanelMode
}

type DragPageStartedArg = {
  pages: Array<ClientPage>
  docID: string
  docParentID: string
}

type DragNodeStartedArg = {
  nodes: string[]
  sourceFolderID: string
}

type SortMenuColumnUpdatedArgs = {
  mode: PanelMode
  column: SortMenuColumn
}

type SortMenuDirectionUpdatedArgs = {
  mode: PanelMode
  direction: SortMenuDirection
}

type ViewOptionArgs = {
  mode: PanelMode
  viewOption: ViewOption
}

type DocumentTypeIDArgs = {
  mode: PanelMode
  documentTypeID?: string
}

export interface UploaderFileItemArgs {
  item: {
    source: NodeType | null
    target_id: string
    file_name: string
  }
  status: FileItemStatus
  error: string | null
}

interface NavBarState {
  collapsed: boolean
  width: number
}

interface UploaderState {
  opened: boolean
  files: Array<FileItemType>
}

interface SearchPanelSizes {
  actionPanelHeight: number
}

// i.e Commander's panel, viewer's panel
interface PanelSizes {
  actionPanelHeight: number
  breadcrumbHeight: number
}

interface CurrentNodeArgs {
  id: string
  ctype: CType
  panel: PanelMode
}

interface CurrentPageUpdatedArgs {
  pageNumber: number
  panel: PanelMode
}

interface CurrentNode {
  id: string
  ctype: CType
}

interface ViewerState {
  currentDocumentVersion: number
}

interface DragNDropState {
  /*
  Document pages currently being dragged.
  Pages can be dragged from Viewer's Thumbnails panel.
  Pages can be dropped either in same Thumbnail's panel,
  in another thumbnail panel or inside Commander
  */
  pages: Array<ClientPage> | null
  pagesDocID?: string
  pagesDocParentID?: string
  // IDs of the nodes being dragged
  nodeIDs: string[] | null
  // ID of the folder where drag 'n drop started
  // or in other words: parent node ID of the dragged nodes
  // used for cache tag invalidation
  sourceFolderID?: string
}

interface SearchState {
  /* Query string as entered by user i.e exactly what user sees
  in search box when he/she submits search query */
  query: string
  /* when clicking on result item, should it open
  clicked item (document or folder) in main panel or in secondary one? */
  openResultItemInOtherPanel: boolean
}

interface DocumentsByTypeColumnsArg {
  mode: PanelMode
  document_type_id: string
  columns: Array<string>
}

interface DocumentsByTypeCommanderColumnToggledArg {
  mode: PanelMode
  name: string
  visibility: boolean
}

export type LastHome = {
  label: string
  home_id: string
  user_id?: string
  group_id?: string
}

export type LastInbox = {
  label: string
  inbox_id: string
  user_id?: string
  group_id?: string
}

interface LastHomeArg {
  mode: PanelMode
  last_home: LastHome
}
interface LastInboxArg {
  mode: PanelMode
  last_inbox: LastInbox
}

interface Pagination {
  pageNumber?: number
  pageSize?: number
}

interface PanelListBase {
  freeTextFilterValue?: string
  pageNumber?: number
  pageSize?: number
  sorting?: SortState
  visibleColumns?: Array<string>
}

interface AuditLogPanelList extends PanelListBase {
  timestampFilterValue?: TimestampFilterType
  operationFilterValue?: Array<AuditOperation>
  tableNameFilterValue?: Array<string>
  usernameFilterValue?: Array<string>
}

interface AuditLogPanelDetails {
  id: string
}

interface RolePanelList extends PanelListBase {}

interface RolePanelDetails {
  id: string
}

export interface UIState {
  uploader: UploaderState
  navbar: NavBarState
  search?: SearchState
  searchLastPageSize?: number
  dragndrop?: DragNDropState
  currentNodeMain?: CurrentNode
  currentNodeSecondary?: CurrentNode
  mainViewer?: ViewerState
  secondaryViewer?: ViewerState
  currentSharedNode?: CurrentNode
  currentSharedRootID?: string
  mainCommanderSelectedIDs?: Array<string>
  mainCommanderFilter?: string
  mainCommanderLastPageSize?: number
  mainCommanderSortMenuColumn?: SortMenuColumn
  mainCommanderSortMenuDir?: SortMenuDirection
  mainCommanderViewOption?: ViewOption
  mainCommanderDocumentTypeID?: string
  /* User may choose between own and group homes
   this field indicates his/her last selection */
  mainCommanderLastHome?: LastHome
  mainCommanderLastInbox?: LastInbox
  mainDocumentsByTypeCommanderColumns?: Record<string, Array<CategoryColumn>>
  secondaryCommanderSelectedIDs?: Array<String>
  secondaryCommanderFilter?: string
  secondaryCommanderLastPageSize?: number
  secondaryCommanderSortMenuColumn?: SortMenuColumn
  secondaryCommanderSortMenuDir?: SortMenuDirection
  secondaryCommanderViewOption?: ViewOption
  secondaryCommanderDocumentTypeID?: string
  /* User may choose between own and group homes
   this field indicates his/her last selection */
  secondaryCommanderLastHome?: LastHome
  secondaryCommanderLastInbox?: LastInbox
  secondaryDocumentsByTypeCommanderColumns: Record<
    string,
    Array<CategoryColumn>
  >
  /* Which component should main panel display:
    commander, viewer or search results? */
  mainPanelComponent?: PanelComponent
  secondaryPanelComponent?: PanelComponent
  mainViewerThumbnailsPanelOpen?: boolean
  mainViewerDocumentDetailsPanelOpen?: boolean
  // zoom factor is expressed as percentage.
  // 5 -> means 5%
  // 100 -> means 100% i.e exact fit
  mainViewerZoomFactor?: number
  mainViewerSelectedIDs?: Array<string>
  mainViewerCurrentDocVerID?: string
  /* current page (number) in main viewer */
  mainViewerCurrentPageNumber?: number
  secondaryViewerThumbnailsPanelOpen?: boolean
  secondaryViewerDocumentDetailsPanelOpen?: boolean
  secondaryViewerZoomFactor?: number
  secondaryViewerSelectedIDs?: Array<string>
  secondaryViewerCurrentDocVerID?: string
  /* current page (number) in secondary viewer */
  secondaryViewerCurrentPageNumber?: number
  viewerPageHaveChangedDialogVisibility?: DialogVisiblity
  mainRoleList?: RolePanelList
  secondaryRoleList?: RolePanelList
  mainRoleDetails?: RolePanelDetails
  secondaryRoleDetails?: RolePanelDetails
}

const initialState: UIState = {
  uploader: {
    opened: false,
    files: []
  },
  navbar: {
    collapsed: initial_collapse_value(),
    width: initial_width_value()
  },
  mainViewerThumbnailsPanelOpen: mainThumbnailsPanelInitialState(),
  secondaryViewerThumbnailsPanelOpen: secondaryThumbnailsPanelInitialState(),
  mainViewerDocumentDetailsPanelOpen: mainDocumentDetailsPanelInitialState(),
  secondaryViewerDocumentDetailsPanelOpen:
    secondaryDocumentDetailsPanelInitialState(),
  mainDocumentsByTypeCommanderColumns: {},
  secondaryDocumentsByTypeCommanderColumns: {}
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    closeUploader: state => {
      state.uploader.opened = false
      state.uploader.files = []
    },
    uploaderFileItemUpdated: (
      state,
      action: PayloadAction<UploaderFileItemArgs>
    ) => {
      const file_name = action.payload.item.file_name
      const target_id = action.payload.item.target_id
      const itemToAdd = {
        status: action.payload.status,
        error: action.payload.error,
        file_name: action.payload.item.file_name,
        source: action.payload.item.source,
        target: action.payload.item.target
      }

      const found = state.uploader.files.find(
        i => i.file_name == file_name && i.target.id == target_id
      )

      if (!found) {
        state.uploader.files.push(itemToAdd)
        state.uploader.opened = true
        return
      }

      const newItems = state.uploader.files.map(i => {
        if (i.file_name == file_name && i.target.id == target_id) {
          return itemToAdd
        } else {
          return i
        }
      })

      state.uploader.files = newItems
      state.uploader.opened = true
    }, // end of uploaderFileItemUpdated
    // ---------------------------------------------------------
    toggleNavBar(state) {
      if (state.navbar.collapsed) {
        state.navbar.collapsed = false
        state.navbar.width = FULL_WIDTH
        Cookies.set(NAVBAR_COLLAPSED_COOKIE, "false")
        Cookies.set(NAVBAR_WIDTH_COOKIE, `${FULL_WIDTH}`)
      } else {
        state.navbar.collapsed = true
        state.navbar.width = COLLAPSED_WIDTH
        Cookies.set(NAVBAR_COLLAPSED_COOKIE, "true")
        Cookies.set(NAVBAR_WIDTH_COOKIE, `${COLLAPSED_WIDTH}`)
      }
    },
    searchResultsLastPageSizeUpdated(state, action: PayloadAction<number>) {
      state.searchLastPageSize = action.payload
    },
    mainPanelSwitchedToSearchResults(state, action: PayloadAction<string>) {
      const query = action.payload
      state.mainPanelComponent = "searchResults"
      state.search = {
        query: query,
        openResultItemInOtherPanel: true
      }
      state.currentNodeMain = undefined
    },
    searchResultItemTargetUpdated(state, action: PayloadAction<boolean>) {
      if (state.search) {
        /* in which panel will search result item open ? */
        state.search.openResultItemInOtherPanel = action.payload
      }
    },
    mainPanelComponentUpdated(state, action: PayloadAction<PanelComponent>) {
      state.mainPanelComponent = action.payload
    },
    secondaryPanelComponentUpdated(
      state,
      action: PayloadAction<PanelComponent | undefined>
    ) {
      state.secondaryPanelComponent = action.payload
    },
    mainPanelRoleDetailsUpdated(state, action: PayloadAction<string>) {
      const roleID = action.payload
      state.mainPanelComponent = "roleDetails"
      state.mainRoleDetails = {id: roleID}
    },
    currentNodeChanged(state, action: PayloadAction<CurrentNodeArgs>) {
      const payload = action.payload
      if (payload.panel == "main") {
        state.currentNodeMain = {
          id: payload.id,
          ctype: payload.ctype
        }
        if (payload.ctype == "folder") {
          state.mainPanelComponent = "commander"
        }
        if (payload.ctype == "document") {
          state.mainPanelComponent = "viewer"
        }
        state.mainCommanderSelectedIDs = []
        return
      }

      // mode == secondary
      state.currentNodeSecondary = {
        id: payload.id,
        ctype: payload.ctype
      }
      if (payload.ctype == "folder") {
        state.secondaryPanelComponent = "commander"
      }
      if (payload.ctype == "document") {
        state.secondaryPanelComponent = "viewer"
      }
      state.secondaryCommanderSelectedIDs = []
    }, // end of currentNodeChanged
    currentSharedNodeChanged(state, action: PayloadAction<CurrentNodeArgs>) {
      const payload = action.payload

      state.currentSharedNode = {
        id: payload.id,
        ctype: payload.ctype
      }
      if (payload.ctype == "folder") {
        state.mainPanelComponent = "sharedCommander"
      }
      if (payload.ctype == "document") {
        state.mainPanelComponent = "sharedViewer"
      }
    }, // end of currentSharedNodeChanged
    currentSharedNodeRootChanged(
      state,
      action: PayloadAction<string | undefined>
    ) {
      state.currentSharedRootID = action.payload
    },
    //------------------------------------------------------------------
    secondaryPanelOpened(state, action: PayloadAction<PanelComponent>) {
      state.secondaryPanelComponent = action.payload
    },

    secondaryPanelClosed(state) {
      state.secondaryPanelComponent = undefined
    },

    commanderSelectionNodeAdded(
      state,
      action: PayloadAction<PanelSelectionArg>
    ) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainCommanderSelectedIDs) {
          state.mainCommanderSelectedIDs.push(itemID)
        } else {
          state.mainCommanderSelectedIDs = [itemID]
        }
        return
      }

      // mode == secondary
      if (state.secondaryCommanderSelectedIDs) {
        state.secondaryCommanderSelectedIDs.push(itemID)
      } else {
        state.secondaryCommanderSelectedIDs = [itemID]
      }
    }, // end of commanderSelectionNodeAdded
    //------------------------------------------------------------------
    commanderSelectionNodeRemoved(
      state,
      action: PayloadAction<PanelSelectionArg>
    ) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainCommanderSelectedIDs) {
          const newValues = state.mainCommanderSelectedIDs.filter(
            i => i != itemID
          )
          state.mainCommanderSelectedIDs = newValues
        }

        return
      }
      // secondary
      if (state.secondaryCommanderSelectedIDs) {
        const newValues = state.secondaryCommanderSelectedIDs.filter(
          i => i != itemID
        )
        state.secondaryCommanderSelectedIDs = newValues
      }
    }, // commanderSelectionNodeRemoved
    //------------------------------------------------------------------
    commanderSelectionCleared(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        state.mainCommanderSelectedIDs = []
        return
      }
      // secondary
      state.secondaryCommanderSelectedIDs = []
    }, // end of commanderSelectionCleared
    //-------------------------------------------
    filterUpdated: (state, action: PayloadAction<UpdateFilterType>) => {
      const {mode, filter} = action.payload
      if (mode == "main") {
        state.mainCommanderFilter = filter
        return
      }

      state.secondaryCommanderFilter = filter
    },
    commanderAllSelectionsCleared(state) {
      state.mainCommanderSelectedIDs = []
      state.secondaryCommanderSelectedIDs = []
    },
    commanderLastPageSizeUpdated(
      state,
      action: PayloadAction<LastPageSizeArg>
    ) {
      const {mode, pageSize} = action.payload
      if (mode == "main") {
        state.mainCommanderLastPageSize = pageSize
        return
      }

      state.secondaryCommanderLastPageSize = pageSize
    },
    commanderSortMenuColumnUpdated(
      state,
      action: PayloadAction<SortMenuColumnUpdatedArgs>
    ) {
      const {mode, column} = action.payload
      if (mode == "main") {
        state.mainCommanderSortMenuColumn = column
      } else {
        state.secondaryCommanderSortMenuColumn = column
      }
    },
    commanderSortMenuDirectionUpdated(
      state,
      action: PayloadAction<SortMenuDirectionUpdatedArgs>
    ) {
      const {mode, direction} = action.payload
      if (mode == "main") {
        state.mainCommanderSortMenuDir = direction
      } else {
        state.secondaryCommanderSortMenuDir = direction
      }
    },
    commanderViewOptionUpdated(state, action: PayloadAction<ViewOptionArgs>) {
      const {mode, viewOption} = action.payload
      if (mode == "main") {
        state.mainCommanderViewOption = viewOption
      } else {
        state.secondaryCommanderViewOption = viewOption
      }
    },
    commanderDocumentTypeIDUpdated(
      state,
      action: PayloadAction<DocumentTypeIDArgs>
    ) {
      const {mode, documentTypeID} = action.payload
      if (mode == "main") {
        state.mainCommanderDocumentTypeID = documentTypeID
      } else {
        state.secondaryCommanderDocumentTypeID = documentTypeID
      }
    },
    lastHomeUpdated(state, action: PayloadAction<LastHomeArg>) {
      const {mode, last_home} = action.payload
      if (mode == "main") {
        state.mainCommanderLastHome = last_home
      } else {
        state.secondaryCommanderLastHome = last_home
      }
    },
    lastInboxUpdated(state, action: PayloadAction<LastInboxArg>) {
      const {mode, last_inbox} = action.payload
      if (mode == "main") {
        state.mainCommanderLastInbox = last_inbox
      } else {
        state.secondaryCommanderLastInbox = last_inbox
      }
    },
    documentsByTypeCommanderColumnsUpdated(
      state,
      action: PayloadAction<DocumentsByTypeColumnsArg>
    ) {
      const mode = action.payload.mode
      const document_type_id = action.payload.document_type_id
      const columns = action.payload.columns

      if (mode == "main") {
        if (!state.mainDocumentsByTypeCommanderColumns) {
          state.mainDocumentsByTypeCommanderColumns = {}
        }
        state.mainDocumentsByTypeCommanderColumns[document_type_id] =
          columns.map(c => {
            return {name: c, visible: true}
          })
      } else {
        if (!state.secondaryDocumentsByTypeCommanderColumns) {
          state.secondaryDocumentsByTypeCommanderColumns = {}
        }
        state.secondaryDocumentsByTypeCommanderColumns[document_type_id] =
          columns.map(c => {
            return {name: c, visible: true}
          })
      }
    },
    documentsByTypeCommanderColumnVisibilityToggled(
      state,
      action: PayloadAction<DocumentsByTypeCommanderColumnToggledArg>
    ) {
      const mode = action.payload.mode
      const name = action.payload.name
      const visibility = action.payload.visibility

      if (mode == "main") {
        const document_type_id = state.mainCommanderDocumentTypeID
        if (!document_type_id) {
          return
        }
        if (!state.mainDocumentsByTypeCommanderColumns) {
          return
        }
        const curState =
          state.mainDocumentsByTypeCommanderColumns[document_type_id]
        const newState = curState.map(col => {
          if (col.name == name) {
            return {name, visible: visibility}
          }
          return col
        })
        state.mainDocumentsByTypeCommanderColumns[document_type_id] = newState
      } else {
        const document_type_id = state.secondaryCommanderDocumentTypeID
        if (!document_type_id) {
          return
        }
        if (!state.secondaryDocumentsByTypeCommanderColumns) {
          return
        }
        const curState =
          state.secondaryDocumentsByTypeCommanderColumns[document_type_id]
        const newState = curState.map(col => {
          if (col.name == name) {
            return {name, visible: visibility}
          }
          return col
        })
        state.secondaryDocumentsByTypeCommanderColumns[document_type_id] =
          newState
      }
    },
    viewerThumbnailsPanelToggled(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        const new_value = !Boolean(state.mainViewerThumbnailsPanelOpen)
        state.mainViewerThumbnailsPanelOpen = new_value
        if (new_value) {
          Cookies.set(MAIN_THUMBNAILS_PANEL_OPENED_COOKIE, "true")
        } else {
          Cookies.set(MAIN_THUMBNAILS_PANEL_OPENED_COOKIE, "false")
        }
        return
      }
      const new_value = !Boolean(state.secondaryViewerThumbnailsPanelOpen)
      state.secondaryViewerThumbnailsPanelOpen = new_value
      if (new_value) {
        Cookies.set(SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE, "true")
      } else {
        Cookies.set(SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE, "false")
      }
    },
    viewerDocumentDetailsPanelToggled(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        const new_value = !Boolean(state.mainViewerDocumentDetailsPanelOpen)
        state.mainViewerDocumentDetailsPanelOpen = new_value
        if (new_value) {
          Cookies.set(MAIN_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE, "true")
        } else {
          Cookies.set(MAIN_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE, "false")
        }
        return
      }
      const new_value = !Boolean(state.secondaryViewerDocumentDetailsPanelOpen)
      state.secondaryViewerDocumentDetailsPanelOpen = new_value
      if (new_value) {
        Cookies.set(SECONDARY_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE, "true")
      } else {
        Cookies.set(SECONDARY_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE, "false")
      }
    },
    zoomFactorIncremented(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        const zoom = state.mainViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom + ZOOM_FACTOR_STEP < MAX_ZOOM_FACTOR) {
          state.mainViewerZoomFactor = zoom + ZOOM_FACTOR_STEP
        }
      }
      if (mode == "secondary") {
        const zoom = state.secondaryViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom + ZOOM_FACTOR_STEP < MAX_ZOOM_FACTOR) {
          state.secondaryViewerZoomFactor = zoom + ZOOM_FACTOR_STEP
        }
      }
    },
    zoomFactorDecremented(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        let zoom = state.mainViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom - ZOOM_FACTOR_STEP > MIN_ZOOM_FACTOR) {
          state.mainViewerZoomFactor = zoom - ZOOM_FACTOR_STEP
        }
      }
      if (mode == "secondary") {
        let zoom = state.secondaryViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom && zoom - ZOOM_FACTOR_STEP > MIN_ZOOM_FACTOR) {
          state.secondaryViewerZoomFactor = zoom - ZOOM_FACTOR_STEP
        }
      }
    },
    zoomFactorReseted(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        state.mainViewerZoomFactor = ZOOM_FACTOR_INIT
      }
      if (mode == "secondary") {
        state.secondaryViewerZoomFactor = ZOOM_FACTOR_INIT
      }
    },
    viewerSelectionPageAdded(state, action: PayloadAction<PanelSelectionArg>) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainViewerSelectedIDs) {
          state.mainViewerSelectedIDs.push(itemID)
        } else {
          state.mainViewerSelectedIDs = [itemID]
        }
        return
      }

      // mode == secondary
      if (state.secondaryViewerSelectedIDs) {
        state.secondaryViewerSelectedIDs.push(itemID)
      } else {
        state.secondaryViewerSelectedIDs = [itemID]
      }
    },
    viewerSelectionPageRemoved(
      state,
      action: PayloadAction<PanelSelectionArg>
    ) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainViewerSelectedIDs) {
          const newValues = state.mainViewerSelectedIDs.filter(i => i != itemID)
          state.mainViewerSelectedIDs = newValues
        }

        return
      }
      // secondary
      if (state.secondaryViewerSelectedIDs) {
        const newValues = state.secondaryViewerSelectedIDs.filter(
          i => i != itemID
        )
        state.secondaryViewerSelectedIDs = newValues
      }
    },
    viewerSelectionCleared(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        state.mainViewerSelectedIDs = []
        return
      }
      // secondary
      state.secondaryViewerSelectedIDs = []
    },
    viewerCurrentPageUpdated(
      state,
      action: PayloadAction<CurrentPageUpdatedArgs>
    ) {
      const {pageNumber, panel} = action.payload

      if (panel == "main") {
        state.mainViewerCurrentPageNumber = pageNumber
        return
      }

      state.secondaryViewerCurrentPageNumber = pageNumber
    },
    currentDocVerUpdated(state, action: PayloadAction<CurrentDocVerUpdateArg>) {
      const {mode, docVerID} = action.payload
      if (mode == "main") {
        state.mainViewerCurrentDocVerID = docVerID
      } else {
        state.secondaryViewerCurrentDocVerID = docVerID
      }
    },
    dragPagesStarted(state, action: PayloadAction<DragPageStartedArg>) {
      const {pages, docID, docParentID} = action.payload
      if (state.dragndrop) {
        state.dragndrop.pages = pages
        state.dragndrop.pagesDocID = docID
        state.dragndrop.pagesDocParentID = docParentID
      } else {
        state.dragndrop = {
          pages: pages,
          pagesDocID: docID,
          pagesDocParentID: docParentID,
          nodeIDs: null
        }
      }
    },
    dragNodesStarted(state, action: PayloadAction<DragNodeStartedArg>) {
      const {nodes, sourceFolderID} = action.payload

      if (state.dragndrop) {
        state.dragndrop.nodeIDs = nodes
        state.dragndrop.sourceFolderID = sourceFolderID
      } else {
        state.dragndrop = {
          nodeIDs: nodes,
          sourceFolderID: sourceFolderID,
          pages: null
        }
      }
    },
    dragEnded(state) {
      if (state.dragndrop) {
        state.dragndrop = undefined
      }
    },
    viewerPageHaveChangedDialogVisibilityChanged(
      state,
      action: PayloadAction<{visibility: DialogVisiblity}>
    ) {
      const newVisibility = action.payload.visibility
      state.viewerPageHaveChangedDialogVisibility = newVisibility
    }
  }
})

export const {
  closeUploader,
  uploaderFileItemUpdated,
  toggleNavBar,
  currentNodeChanged,
  currentSharedNodeChanged,
  currentSharedNodeRootChanged,
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated,
  searchResultsLastPageSizeUpdated,
  mainPanelRoleDetailsUpdated,
  /* Main panel switched to show search results.
  This happens when user clicks enter in search field
  in the header */
  mainPanelSwitchedToSearchResults,
  searchResultItemTargetUpdated,
  secondaryPanelClosed,
  secondaryPanelOpened,
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  commanderSelectionCleared,
  commanderAllSelectionsCleared,
  filterUpdated,
  commanderLastPageSizeUpdated,
  commanderSortMenuColumnUpdated,
  commanderSortMenuDirectionUpdated,
  commanderViewOptionUpdated,
  commanderDocumentTypeIDUpdated,
  viewerThumbnailsPanelToggled,
  viewerDocumentDetailsPanelToggled,
  zoomFactorIncremented,
  zoomFactorDecremented,
  zoomFactorReseted,
  viewerSelectionPageAdded,
  viewerSelectionPageRemoved,
  viewerSelectionCleared,
  viewerCurrentPageUpdated,
  currentDocVerUpdated,
  dragPagesStarted,
  dragNodesStarted,
  dragEnded,
  documentsByTypeCommanderColumnsUpdated,
  documentsByTypeCommanderColumnVisibilityToggled,
  lastHomeUpdated,
  lastInboxUpdated,
  viewerPageHaveChangedDialogVisibilityChanged
} = uiSlice.actions
export default uiSlice.reducer

export const selectOpened = (state: RootState): boolean =>
  state.ui.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.ui.uploader.files

export const selectNavBarCollapsed = (state: RootState) =>
  state.ui.navbar.collapsed
export const selectNavBarWidth = (state: RootState) => state.ui.navbar.width

export const selectCurrentNode = (
  state: RootState,
  mode: PanelMode
): CurrentNode | undefined => {
  if (mode == "main") {
    return state.ui.currentNodeMain
  }

  return state.ui.currentNodeSecondary
}

export const selectCurrentNodeID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.currentNodeMain?.id
  }

  return state.ui.currentNodeSecondary?.id
}

export const selectCurrentSharedNodeID = (state: RootState) => {
  return state.ui.currentSharedNode?.id
}

export const selectSharedNode = (state: RootState, nodeID: string) => {
  return state.sharedNodes.entities[nodeID]
}

export const selectCurrentSharedRootID = (state: RootState) => {
  return state.ui.currentSharedRootID
}

export const selectCurrentNodeCType = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.currentNodeMain?.ctype
  }

  return state.ui.currentNodeSecondary?.ctype
}

export const selectCurrentDocumentID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    const node = state.ui.currentNodeMain
    if (node?.ctype == "document") {
      return node.id
    }
  }

  const node = state.ui.currentNodeSecondary
  if (node?.ctype == "document") {
    return node.id
  }
}

export const selectPanelComponent = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainPanelComponent
  }

  return state.ui.secondaryPanelComponent
}

export const selectOtherPanelComponent = (
  state: RootState,
  mode: PanelMode
) => {
  /* select other panel (as opposite to current one)
  if mode == "main" => selects "secondary" panel component
  if mode == "secondary" => select "main" panel component
  */
  if (mode == "main") {
    return state.ui.secondaryPanelComponent
  }

  return state.ui.mainPanelComponent
}

export const selectSelectedNodeIds = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderSelectedIDs || []
  }

  return state.ui.secondaryCommanderSelectedIDs || []
}

export const selectSelectedNodesCount = createSelector(
  selectSelectedNodeIds,
  selectedIds => {
    if (!selectedIds) {
      return 0
    }

    return selectedIds.length
  }
)

export const selectOneSelectedSharedNode = (
  state: RootState,
  mode: PanelMode
): undefined | NodeType => {
  if (mode == "main") {
    if (
      state.ui.mainCommanderSelectedIDs &&
      state.ui.mainCommanderSelectedIDs.length == 1
    ) {
      const sel_id = state.ui.mainCommanderSelectedIDs[0]
      if (
        state.nodes.entities[sel_id] &&
        state.nodes.entities[sel_id].is_shared
      ) {
        return state.nodes.entities[sel_id]
      }
    }
    return undefined
  } // main

  if (
    state.ui.secondaryCommanderSelectedIDs &&
    state.ui.secondaryCommanderSelectedIDs.length == 1
  ) {
    const sel_id2 = state.ui.secondaryCommanderSelectedIDs[0] as string
    if (
      state.nodes.entities &&
      state.nodes.entities[sel_id2] &&
      state.nodes.entities[sel_id2].is_shared
    ) {
      return state.nodes.entities[sel_id2]
    }
  }

  return undefined
}

export const selectFilterText = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderFilter
  }

  return state.ui.secondaryCommanderFilter
}

export const selectThumbnailsPanelOpen = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return Boolean(state.ui.mainViewerThumbnailsPanelOpen)
  }

  return Boolean(state.ui.secondaryViewerThumbnailsPanelOpen)
}

export const selectDocumentDetailsPanelOpen = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return Boolean(state.ui.mainViewerDocumentDetailsPanelOpen)
  }

  return Boolean(state.ui.secondaryViewerDocumentDetailsPanelOpen)
}

export const selectLastPageSize = (
  state: RootState,
  mode: PanelMode
): number => {
  if (mode == "main") {
    return (
      state.ui.mainCommanderLastPageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.ui.secondaryCommanderLastPageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectCommanderSortMenuColumn = (
  state: RootState,
  mode: PanelMode
): SortMenuColumn => {
  if (mode == "main") {
    return state.ui.mainCommanderSortMenuColumn || "updated_at"
  }

  return state.ui.secondaryCommanderSortMenuColumn || "updated_at"
}

export const selectCommanderSortMenuDir = (
  state: RootState,
  mode: PanelMode
): SortMenuDirection => {
  if (mode == "main") {
    return state.ui.mainCommanderSortMenuDir || "az"
  }

  return state.ui.secondaryCommanderSortMenuDir || "az"
}

export const selectCommanderViewOption = (
  state: RootState,
  mode: PanelMode
): ViewOption => {
  if (mode == "main") {
    return state.ui.mainCommanderViewOption || "tile"
  }

  return state.ui.secondaryCommanderViewOption || "tile"
}

export const selectCommanderDocumentTypeID = (
  state: RootState,
  mode: PanelMode
): string | undefined => {
  if (mode == "main") {
    return state.ui.mainCommanderDocumentTypeID
  }

  return state.ui.secondaryCommanderDocumentTypeID
}

export const selectZoomFactor = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerZoomFactor || ZOOM_FACTOR_INIT
  }

  return state.ui.secondaryViewerZoomFactor || ZOOM_FACTOR_INIT
}

export const selectCurrentDocVerID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerCurrentDocVerID
  }

  return state.ui.secondaryViewerCurrentDocVerID
}

export const selectCurrentDocVer = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    if (state.ui.mainViewerCurrentDocVerID) {
      return state.docVers.entities[state.ui.mainViewerCurrentDocVerID]
    }
  }

  if (state.ui.secondaryViewerCurrentDocVerID) {
    return state.docVers.entities[state.ui.secondaryViewerCurrentDocVerID]
  }
}

export const selectDraggedPages = (state: RootState) =>
  state.ui.dragndrop?.pages

export const selectDraggedPagesDocID = (state: RootState) =>
  state.ui.dragndrop?.pagesDocID

export const selectDraggedPagesDocParentID = (state: RootState) =>
  state.ui.dragndrop?.pagesDocParentID

export const selectDraggedNodeIDs = (state: RootState) =>
  state.ui.dragndrop?.nodeIDs

export const selectDraggedNodes = createSelector(
  /** Input selectors */
  [(state: RootState) => state.nodes.entities, selectDraggedNodeIDs],
  (
    entities: Record<string, NodeType>,
    draggedNodeIDs: string[] | undefined | null
  ) => {
    /** Returns `NodeType` objects of the nodes
     * currently being dragged */
    return Object.values(entities).filter((n: NodeType) =>
      draggedNodeIDs?.includes(n.id)
    )
  }
)

export const selectDraggedNodesSourceFolderID = (state: RootState) => {
  return state.ui.dragndrop?.sourceFolderID
}

export const selectSearchQuery = (state: RootState) => state.ui.search?.query

export const selectSearchLastPageSize = (state: RootState): number =>
  state.ui.searchLastPageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES

export const selectOpenResultItemInOtherPanel = (state: RootState) =>
  state.ui.search?.openResultItemInOtherPanel

export const selectDocumentCurrentPage = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.ui.mainViewerCurrentPageNumber
  }

  return state.ui.secondaryViewerCurrentPageNumber
}

export const selectDocumentsByTypeCommanderColumns = (
  state: RootState,
  mode: PanelMode
): Array<CategoryColumn> => {
  if (mode == "main") {
    const document_type_id = state.ui.mainCommanderDocumentTypeID
    if (state.ui.mainDocumentsByTypeCommanderColumns && document_type_id) {
      return (
        state.ui.mainDocumentsByTypeCommanderColumns[document_type_id] || []
      )
    }

    return []
  }

  const document_type_id = state.ui.secondaryCommanderDocumentTypeID
  if (state.ui.mainDocumentsByTypeCommanderColumns && document_type_id) {
    return state.ui.mainDocumentsByTypeCommanderColumns[document_type_id] || []
  }

  return []
}

export const selectDocumentsByTypeCommanderVisibleColumns = createSelector(
  selectDocumentsByTypeCommanderColumns,
  columns => {
    const visibleColumnNames = columns.filter(c => c.visible).map(c => c.name)
    return visibleColumnNames
  }
)

export const selectLastHome = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderLastHome
  }

  return state.ui.secondaryCommanderLastHome
}

export const selectLastInbox = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderLastInbox
  }

  return state.ui.secondaryCommanderLastInbox
}

export const selectViewerPagesHaveChangedDialogVisibility = (
  state: RootState
) => {
  return state.ui.viewerPageHaveChangedDialogVisibility || "closed"
}

/* Load initial collapse state value from cookie */
function initial_collapse_value(): boolean {
  const collapsed = Cookies.get(NAVBAR_COLLAPSED_COOKIE) as BooleanString

  if (collapsed == "true") {
    return true
  }

  return false
}

/* Load initial width value from cookie */
function initial_width_value(): number {
  const width = Cookies.get(NAVBAR_WIDTH_COOKIE)

  if (width) {
    const ret = parseInt(width)
    if (ret > 0) {
      return ret
    } else {
      return FULL_WIDTH
    }
  }

  return FULL_WIDTH
}

function mainThumbnailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    MAIN_THUMBNAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}

function secondaryThumbnailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}

function mainDocumentDetailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    MAIN_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}

function secondaryDocumentDetailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    SECONDARY_DOCUMENT_DETAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}
