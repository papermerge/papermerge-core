import type {ByUser} from "./common"

export type NewCustomField = {
  name: string
}

export type CustomField = {
  id: string
  name: string
}

export type CustomFieldDetails = CustomField & {
  created_at: string
  created_by: ByUser
  updated_at: string
  updated_by: ByUser
}

export type CustomFieldDetailsPostData = {
  id: string
  name: string
}

export type CustomFieldUpdate = {
  id: string
  name?: string
}
