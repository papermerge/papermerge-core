export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
}


export type UserList = {
  page_size: number;
  page_number: number;
  num_pages: number;
  items: Array<User>;
}


export type UserView = "list" | "edit" | "new";
