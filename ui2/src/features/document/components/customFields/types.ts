import type {DocumentCustomFieldValue} from "@/types"

export type onChangeArgs = {
  customField: DocumentCustomFieldValue
  value: string
}

export type onChangeType = ({customField, value}: onChangeArgs) => void

export interface CustomFieldArgs {
  customField: DocumentCustomFieldValue
  onChange: onChangeType
}
