import type {CustomField} from "@/types"

export type NewDocType = {
  name: string
  path_template?: string
  custom_field_ids: Array<string>
  group_id?: string
}

export type DocType = {
  id: string
  name: string
  path_template?: string
  custom_fields: Array<CustomField>
  group_name?: string
  group_id?: string
}

export type DocTypeUpdate = {
  id: string
  name: string
  custom_field_ids: Array<string>
  group_id?: string
}

export type DocumentTypeListColumnName = "name" | "group_name"
export type DocumentTypeSortByInput =
  | "name"
  | "-name"
  | "group_name"
  | "-group_name"
