import type {CFV} from "@/types"

export type onChangeArgs = {
  customField: CFV
  value: string | boolean
}

export type onChangeType = ({customField, value}: onChangeArgs) => void

export interface CustomFieldArgs {
  customField: CFV
  onChange: onChangeType
}
