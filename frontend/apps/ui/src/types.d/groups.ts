import type { ByUser } from "./common"

export type NewGroup = {
  name: string
  with_special_folders: boolean
}

export type Group = {
  id: string
  name: string
  home_folder_id: string | null
  inbox_folder_id: string | null
}

export type GroupDetails = Group & {
  created_at: string
  created_by: ByUser
  updated_at: string
  updated_by: ByUser
}

export type GroupDetailsPostData = {
  id: string
  name: string
  with_special_folders: boolean
}

export type GroupUpdate = {
  id: string
  name?: string
  delete_special_folders?: boolean
}
