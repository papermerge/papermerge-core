export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export type NewUser = {
  username: string;
  email: string;
  password: string;
  scopes: Array<string>;
  groups: Array<string>;
}


export type CreatedUser = {
  id: string;
  username: string;
  email: string;
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
