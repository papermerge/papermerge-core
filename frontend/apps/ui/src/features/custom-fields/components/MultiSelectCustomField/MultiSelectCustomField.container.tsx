import {MultiSelectCustomFieldPresentation} from "./MultiSelectCustomField.presentation"
import type {MultiSelectCustomFieldContainerProps} from "./types"
import {useMultiSelectCustomField} from "./useMultiSelectCustomField"

/**
 * Container component for multiselect custom field
 *
 * Connects the useMultiSelectCustomField hook with the presentation component.
 * Used in document details to allow users to select multiple values for a multiselect-type custom field.
 */
export function MultiSelectCustomFieldContainer({
  customField,
  onChange
}: MultiSelectCustomFieldContainerProps) {
  const {values, options, label, maxSelections, handleChange} =
    useMultiSelectCustomField({
      customField,
      onChange
    })

  return (
    <MultiSelectCustomFieldPresentation
      values={values}
      options={options}
      label={label}
      maxSelections={maxSelections}
      onChange={handleChange}
    />
  )
}

export default MultiSelectCustomFieldContainer
