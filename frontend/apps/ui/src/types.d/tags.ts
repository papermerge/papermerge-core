import type {ByUser} from "./common"

export type Tag = {
  id: string
  name: string
}

export type TagDetails = Tag & {
  created_at: string
  created_by: ByUser
  updated_at: string
  updated_by: ByUser
}
