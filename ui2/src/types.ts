
export type User = {
  id: string;
  username: string;
  email: string;
  home_folder_id: string;
  inbox_folder_id: string;
  scopes: Array<string>;
}


export type SliceState<T> = {
  data: null | T,
  status: 'idle' | 'loading' | 'succeeded' | 'failed',
  error: undefined | string | null
}