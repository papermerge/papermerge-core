import type {CustomField} from "@/types"

export type NewDocType = {
  name: string
  path_template?: string
  custom_field_ids: Array<string>
}

export type DocType = {
  id: string
  name: string
  path_template?: string
  custom_fields: Array<CustomField>
}

export type DocTypeUpdate = {
  id: string
  name: string
  custom_field_ids: Array<string>
}

export type DocumentTypeListColumnName = "name"
export type DocumentTypeSortByInput = "name" | "-name"
