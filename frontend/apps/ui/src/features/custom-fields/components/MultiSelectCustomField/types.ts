import type {CustomFieldWithValue} from "@/types"

export interface SelectOption {
  value: string
  label: string
  color?: string
  icon?: string
  description?: string
}

export interface MultiSelectConfig {
  options: SelectOption[]
  allow_custom?: boolean
  min_selections?: number
  max_selections?: number
  separator?: string
  required?: boolean
}

export interface MultiSelectCustomFieldState {
  values: string[]
  options: SelectOption[]
  label: string
  disabled?: boolean
  maxSelections?: number
}

export interface MultiSelectCustomFieldActions {
  onChange: (values: string[]) => void
}

export interface MultiSelectCustomFieldProps
  extends MultiSelectCustomFieldState,
    MultiSelectCustomFieldActions {}

export interface MultiSelectCustomFieldContainerProps {
  customField: CustomFieldWithValue
  onChange: (args: {
    customField: CustomFieldWithValue
    value: string | boolean
  }) => void
}
