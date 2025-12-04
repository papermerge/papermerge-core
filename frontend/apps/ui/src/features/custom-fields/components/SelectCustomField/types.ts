import type {CustomFieldWithValue} from "@/types"

export interface SelectOption {
  value: string
  label: string
  color?: string
  icon?: string
  description?: string
}

export interface SelectConfig {
  options: SelectOption[]
  allow_custom?: boolean
  required?: boolean
}

export interface SelectCustomFieldState {
  value: string | null
  options: SelectOption[]
  label: string
  disabled?: boolean
}

export interface SelectCustomFieldActions {
  onChange: (value: string | null) => void
}

export interface SelectCustomFieldProps
  extends SelectCustomFieldState,
    SelectCustomFieldActions {}

export interface SelectCustomFieldContainerProps {
  customField: CustomFieldWithValue
  onChange: (args: {customField: CustomFieldWithValue; value: string}) => void
}
