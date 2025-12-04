/**
 * Types for Select/MultiSelect custom field option configuration
 */

export interface SelectOption {
  value: string
  label: string
  color?: string
  icon?: string
  description?: string
}

export interface SelectOptionsState {
  options: SelectOption[]
}

export interface SelectOptionsActions {
  onAddOption: () => void
  onRemoveOption: (index: number) => void
  onOptionLabelChange: (index: number, label: string) => void
  onOptionValueChange: (index: number, value: string) => void
}

export interface SelectOptionsProps
  extends SelectOptionsState,
    SelectOptionsActions {
  disabled?: boolean
}
