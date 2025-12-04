import {MultiSelect} from "@mantine/core"
import type {MultiSelectCustomFieldProps, SelectOption} from "./types"

/**
 * Presentation component for multiselect custom field
 *
 * Renders a Mantine MultiSelect component with options from custom field config.
 * Pure presentational - all state management is handled by parent/hook.
 */
export function MultiSelectCustomFieldPresentation({
  values,
  options,
  label,
  disabled = false,
  maxSelections,
  onChange
}: MultiSelectCustomFieldProps) {
  // Transform options to Mantine MultiSelect format
  const selectData = options.map((opt: SelectOption) => ({
    value: opt.value,
    label: opt.label
  }))

  return (
    <MultiSelect
      label={label}
      value={values}
      data={selectData}
      onChange={onChange}
      disabled={disabled}
      clearable
      searchable
      placeholder="Select options"
      maxValues={maxSelections}
      hidePickedOptions
    />
  )
}

export default MultiSelectCustomFieldPresentation
