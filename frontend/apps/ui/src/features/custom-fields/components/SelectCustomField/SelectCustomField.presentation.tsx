import {Select} from "@mantine/core"
import type {SelectCustomFieldProps, SelectOption} from "./types"

/**
 * Presentation component for select custom field
 *
 * Renders a Mantine Select component with options from custom field config.
 * Pure presentational - all state management is handled by parent/hook.
 */
export function SelectCustomFieldPresentation({
  value,
  options,
  label,
  disabled = false,
  onChange
}: SelectCustomFieldProps) {
  // Transform options to Mantine Select format
  const selectData = options.map((opt: SelectOption) => ({
    value: opt.value,
    label: opt.label
  }))

  return (
    <Select
      label={label}
      value={value}
      data={selectData}
      onChange={onChange}
      disabled={disabled}
      clearable
      searchable
      placeholder="Select an option"
    />
  )
}

export default SelectCustomFieldPresentation
