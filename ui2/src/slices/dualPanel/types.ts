import type {
  SliceState,
  NodeType,
  SearchResultNode,
  PanelMode,
  PanelType,
  CurrentNodeType,
  PaginationType,
  BreadcrumbItemType,
  DocumentVersion
} from "@/types"

export type NodeWithSpinner = {
  id: string
  // When user clicks a node in commander, respective node
  // gives user immediate feedback by showing rotating spinner
  // next to the node (i.e. I got your click => now loading subfolder/doc)
  status: "idle" | "loading"
}

export type SetCurrentNodeArgs = {
  node: CurrentNodeType
  panel: PanelMode
}

export type FolderAddedArgs = {
  node: NodeType
  mode: PanelMode
}

export type NodeUpdatedArgs = FolderAddedArgs

export type SelectionNodePayload = {
  selectionId: string
  mode: PanelMode
}

export interface Commander {
  currentNode: CurrentNodeType | null
  pagination: PaginationType | null | undefined
  lastPageSize: number
  nodes: SliceState<Array<NodeWithSpinner>>
  selectedIds: Array<string>
}

export interface Viewer {
  breadcrumb: Array<BreadcrumbItemType> | null
  versions: Array<DocumentVersion>
  currentVersion: number | null
  currentPage: number
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
  nodes: Array<NodeType>
}
