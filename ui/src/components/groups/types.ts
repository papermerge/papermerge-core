export type Group = {
  id: number;
  name: string;
}

export type NewGroup = {
  name: string;
}


export type CreatedGroup = {
  id: number;
  name: string;
}

export type GroupList = {
  page_size: number;
  page_number: number;
  num_pages: number;
  items: Array<Group>;
}


export type GroupView = "list" | "edit" | "new";
