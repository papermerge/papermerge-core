import React from 'react';

export type DefaultHeaderType = Record<string, string>

export type ColoredTagType = {
  name: string;
  bg_color: string;
  fg_color: string;
}

export type OcrStatusEnum = "UNKNOWN" | "RECEIVED" | "STARTED" | "SUCCESS" | "FAILURE";


export type SearchResult = {
  id: string;
  document_id: string | null;
  document_version_id: string | null;
  title: string;
  entity_type: "folder" | "page";
  page_number: number | null;
  page_count: number | null;
  tags: Array<ColoredTag>;
  breadcrumb: Array<[string, string]>;
}


export type User = {
  username: string;
  email: string;
  home_folder_id: string;
  inbox_folder_id: string;
  scopes: Array<string>;
}

export type UserContextType = {
  isLoading: boolean;
  isError: boolean;
  user: User | null;
}

export type SimpleComponentArgs = {
  children: React.ReactNode;
}

export type CType = "folder" | "document";

export type BreadcrumbItemType = [string, string];

export type TargetFolder = {
  id: string;
  title: string;
}

export type BreadcrumbType = Array<BreadcrumbItemType>;


export type NType = {
  /* Short version of the Node Type */
  id: string;
  ctype: CType;
}

export type NodeType = NType & {
  /* Full version of Node Type */
  tags: ColoredTagType[];
  accept_dropped_nodes: boolean;
  is_currently_dragged: boolean;
  parent_id: string | null;
  title: string;
  user_id: string;
  update_at: string;
  ocr_status: OcrStatusEnum;
  ocr: boolean;
  thumbnail_url: string | null;
}


export type FolderType = NodeType & {
  breadcrumb: BreadcrumbType;
}


export type PageType = {
  id: string;
  document_version_id: string;
  jpg_url: string | null;
  svg_url: string | null;
  lang: string;
  number: number;
  text: string;
}

export type DocumentVersion = {
  id: string;
  document_id: string;
  download_url: string;
  file_name: string;
  lang: OCRCode;
  number: number;
  page_count: number;
  pages: Array<PageType>;
  short_description: string;
  size: number;
}

export type DocumentType = {
  id: string;
  ctype: 'document';
  title: string;
  breadcrumb: BreadcrumbType;
  ocr: boolean;
  ocr_status: OcrStatusEnum;
  thumbnail_url: string;
  versions: Array<DocumentVersion>;
  parent_id: string | null;
  user_id: string;
  updated_at: string;
}

export type MovePagesBetweenDocsType = {
  source: DocumentType | null;
  target: DocumentType;
}

export enum DisplayNodesModeEnum {
  List = 1,
  Tiles,
}

export type NodeSortFieldEnum = "title" | "ctype" | "created_at" | "updated_at";

export type NodeSortOrderEnum = "asc" | "desc";

export type Pagination = {
  page_number: number;
  per_page: number;
}

export type Sorting = {
  sort_field: NodeSortFieldEnum;
  sort_order: NodeSortOrderEnum;
}

export type NodesType = {
  parent: FolderType;
  breadcrumb: BreadcrumbType;
  nodes: NodeType[];
  num_pages: number;
  page_number: number;
  per_page: number;
}

export type UUIDList = Array<string>;
export type NodeList = Array<NodeType>;


export type NodeClickArgsType = {
  node_id: string;
  node_type: CType;
}

export type State<T> = {
  is_loading: boolean;
  error: string | null;
  data: T | null;
}

export type Vow<T> = {
  is_pending: boolean;
  loading_id?: string | number | null;
  error: string | null;
  data: T | null;
}

export type OcrStatusType = {
    status: OcrStatusEnum;
}

export enum AppContentBlockEnum {
   inbox = "inbox",
   home = "home",
   tags = "tags",
   users = "users",
   groups = "groups",
   search_results = "search_results"
}


export interface IColoredTag {
  name: string;
  description: string;
  fg_color: string;
  bg_color: string;
  pinned: boolean;
}

export type ColoredTag = {
  id: string;
  name: string;
  description: string;
  fg_color: string;
  bg_color: string;
  pinned: boolean;
}


export type ColoredTagList = {
  page_size: number;
  page_number: number;
  num_pages: number;
  items: Array<ColoredTag>;
}


export type LoadableTagList = {
  is_loading: boolean;
  error: string | null;
  data: ColoredTagList | null;
}

export type PageAndRotOp = { // page and rotation operation
  page: PageType;
  angle: 0; // rotation degree, can be positive or negative
}


export type DroppedThumbnailPosition = 'before' | 'after';
export type ThumbnailPageDroppedArgs = {
  source_ids: Array<string>;
  target_id: string;
  position: DroppedThumbnailPosition;
}


export type ShowDualButtonEnum = 'split' | 'close';


export type CreatedNodesType = {
  nodes: NodeType[];
  parent_id: string;
}

export type MovedNodesType = CreatedNodesType;  // alias
export type MovedDocumentType = {
  doc: DocumentType;
  target_folder: TargetFolder;
}

export type TargetDirection = 'left' | 'right';

export type onMovedNodesType = {
  target_id: string;
  source: NodeType[];
}

export type ExtractedPagesType = {
  source: DocumentType | null;
  target: NodeType[];  // newly created document nodes
  target_parent: TargetFolder;
}

export type ExtractStrategy = 'one-page-per-doc' | 'all-pages-in-one-doc';

export type DataTransferExtractedPages = {
  pages: string[];
  document_title: string;
}

export type OCRCode =
  | 'ces'
  | 'dan'
  | 'deu'
  | 'ell'
  | 'eng'
  | 'fin'
  | 'fra'
  | 'guj'
  | 'heb'
  | 'hin'
  | 'ita'
  | 'jpn'
  | 'kor'
  | 'lit'
  | 'nld'
  | 'nor'
  | 'osd'
  | 'pol'
  | 'por'
  | 'ron'
  | 'san'
  | 'spa'

export type OCRLangType = {
  [key: string]: string
}

export type ScopeType = {
  [key: string]: string
}

export type Coord = {
  x: number;
  y: number;
}

export type RemoteUserHeaderName = {
  remote_user: string;
  remote_groups: string;
  remote_email: string;
  remote_name: string;
}

export type RuntimeConfig = {
  remote_user: {
    headers_name: RemoteUserHeaderName;
    logout_endpoint: string;
  }
  oidc: {
    logout_url: string;
    authorize_url: string;
    client_id: string;
  }
}

export type SelectItem = {
  key: string;
  value: string;
}

export type Group = {
  id: string;
  name: string;
}

export type Paginated<T> = {
  page_size: number;
  page_number: number;
  num_pages: number;
  items: Array<T>;
}

declare global {
  interface Window {
    __PAPERMERGE_RUNTIME_CONFIG__: RuntimeConfig;
  }
}
