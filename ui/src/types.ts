import React from 'react';


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


export type NodeType = {
  id: string
  ctype: CType;
  accept_dropped_nodes: boolean;
  is_currently_dragged: boolean;
  parent_id: string | null;
  title: string;
  user_id: string;
  update_at: string;
}

export type FolderType = NodeType & {
  breadcrumb: BreadcrumbType;
}

export enum DisplayNodesModeEnum {
  List = 1,
  Tiles,
}
