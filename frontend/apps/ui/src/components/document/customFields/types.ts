import type {CustomFieldWithValue} from "@/types"

export type onChangeArgs = {
  customField: CustomFieldWithValue
  value: string | boolean
}

export type onChangeType = ({customField, value}: onChangeArgs) => void

export interface CustomFieldArgs {
  customField: CustomFieldWithValue
  onChange: onChangeType
}
