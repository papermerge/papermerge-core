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

export type GroupDetails = Group

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
