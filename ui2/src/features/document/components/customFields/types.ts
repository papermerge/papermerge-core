import type {CFV} from "@/types"

export type onChangeArgs = {
  customField: CFV
  value: string
}

export type onChangeType = ({customField, value}: onChangeArgs) => void

export interface CustomFieldArgs {
  customField: CFV
  onChange: onChangeType
}
