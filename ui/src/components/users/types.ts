
type Group = {
  id: number;
  name: string;
}


export type User = {
  id: string;
  username: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
}

export type UserDetail = {
  id: string;
  username: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
  groups: Array<Group>;
  scopes: Array<string>;
}

export type NewUser = {
  username: string;
  email: string;
  password: string;
  is_superuser: boolean;
  is_active: boolean;
  scopes: Array<string>;
  group_ids: Array<number>;
}


export type CreatedUser = {
  id: string;
  username: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
  inbox_folder_id: string;
  home_folder_id: string;
}


export type UserList = {
  page_size: number;
  page_number: number;
  num_pages: number;
  items: Array<User>;
}

export type UserView = "list" | "edit" | "new";
