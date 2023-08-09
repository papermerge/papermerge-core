import React from 'react';

export type ColoredTagType = {
  name: string;
  bg_color: string;
  fg_color: string;
}

export type OcrStatusEnum = "UNKNOWN" | "RECEIVED" | "STARTED" | "SUCCESS" | "FAILED";


export type SearchResult = {
  id: string;
  document_id: string | null;
  document_version_id: string | null;
  title: string;
  entity_type: "folder" | "page";
  page_number: number | null;
  page_count: number | null;
  tags: Array<string>;
  breadcrumb: Array<string>;
}


export type User = {
  username: string;
  email: string;
  home_folder_id: string;
  inbox_folder_id: string;
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

export type BreadcrumbType = Array<BreadcrumbItemType>;

export type DocumentNodeType = {
  ocr_status: OcrStatusEnum;
  thumbnail_url: string | null;
}


export type NodeType = {
  id: string;
  ctype: CType;
  tags: ColoredTagType[];
  accept_dropped_nodes: boolean;
  is_currently_dragged: boolean;
  parent_id: string | null;
  title: string;
  user_id: string;
  update_at: string;
  document: DocumentNodeType | null;
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
  lang: string;
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

export enum DisplayNodesModeEnum {
  List = 1,
  Tiles,
}

export enum NodeSortFieldEnum {
  title = "title",
  type = "ctype",
  created_at = "created_at",
  updated_at = "updated_at"
}

export enum NodeSortOrderEnum {
  asc = "asc",
  desc = "desc"
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

export type OcrStatusType = {
    status: OcrStatusEnum;
}

export enum AppContentBlockEnum {
   inbox = "inbox",
   home = "home",
   tags = "tags",
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
