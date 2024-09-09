import type {
  SliceState,
  NodeType,
  SearchResultNode,
  PanelMode,
  PanelType,
  CurrentNodeType,
  PaginationType,
  BreadcrumbItemType,
  DocumentVersionWithPageRot,
  PageAndRotOp
} from "@/types"

export type NodeWithSpinner = {
  id: string
  // When user clicks a node in commander, respective node
  // gives user immediate feedback by showing rotating spinner
  // next to the node (i.e. I got your click => now loading subfolder/doc)
  status: "idle" | "loading"
}

export type FolderAddedArgs = {
  node: NodeType
  mode: PanelMode
}

export type SelectionNodePayload = {
  selectionId: string
  mode: PanelMode
}

export type SelectionPagePayload = {
  selectionId: string
  mode: PanelMode
}

export interface Commander {
  pagination: PaginationType | null | undefined
  lastPageSize: number
}

export interface Viewer {
  breadcrumb: Array<BreadcrumbItemType> | null
  versions: Array<DocumentVersionWithPageRot>
  currentVersion: number | null
  currentPage: number
  // is thumbnails panel open?
  thumbnailsPanelOpen: boolean
  // zoom factor is expressed as percentage.
  // 5 -> means 5%
  // 100 -> means 100% i.e exact fit
  zoomFactor: number
  // selected page IDs
  selectedIds: Array<string>
  initialPages: Array<PageAndRotOp>
}

export interface SearchResults {
  pagination: PaginationType | null | undefined
  items: SliceState<Array<SearchResultNode>>
  // when clicking on search result item - in which panel
  // should it be opened? in main or in secondary ?
  openItemTargetPanel: PanelType
  query: string
}

export interface SinglePanel {
  commander: Commander | null
  viewer: Viewer | null
  searchResults: SearchResults | null
}

export interface DualPanelState {
  mainPanel: SinglePanel
  secondaryPanel: SinglePanel | null
}
