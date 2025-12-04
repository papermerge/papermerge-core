import {SelectCustomFieldPresentation} from "./SelectCustomField.presentation"
import type {SelectCustomFieldContainerProps} from "./types"
import {useSelectCustomField} from "./useSelectCustomField"

/**
 * Container component for select custom field
 *
 * Connects the useSelectCustomField hook with the presentation component.
 * Used in document details to allow users to select a value for a select-type custom field.
 */
export function SelectCustomFieldContainer({
  customField,
  onChange
}: SelectCustomFieldContainerProps) {
  const {value, options, label, handleChange} = useSelectCustomField({
    customField,
    onChange
  })

  return (
    <SelectCustomFieldPresentation
      value={value}
      options={options}
      label={label}
      onChange={handleChange}
    />
  )
}

export default SelectCustomFieldContainer
