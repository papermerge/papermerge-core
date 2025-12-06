// Main component exports
export {
  CustomFieldsContainer,
  CustomFieldsContainer as default
} from "./CustomFields.container"
export {CustomFieldsPresentation} from "./CustomFields.presentation"

// Hook exports
export {useAutoSaveCustomField} from "./useAutoSaveCustomField"
export {useCustomFields} from "./useCustomFields"

// Field component exports
export {BooleanField} from "./BooleanField"
export {DateField} from "./DateField"
export {MonetaryField} from "./MonetaryField"
export {MultiSelectField} from "./MultiSelectField"
export {SelectField} from "./SelectField"
export {TextField} from "./TextField"
export {YearMonthField} from "./YearMonthField"

// Utility component exports
export {SaveStatusIndicator} from "./SaveStatusIndicator"

// Type exports
export type {
  AutoSaveCustomFieldProps,
  BooleanFieldProps,
  CustomFieldsPresentationProps,
  CustomFieldValue,
  DateFieldProps,
  FieldInputProps,
  MonetaryConfig,
  MonetaryFieldProps,
  MultiSelectConfig,
  MultiSelectFieldProps,
  SaveStatus,
  SelectConfig,
  SelectFieldProps,
  SelectOption,
  TextFieldProps,
  UseAutoSaveCustomFieldReturn,
  UseCustomFieldsActions,
  UseCustomFieldsReturn,
  UseCustomFieldsState,
  YearMonthFieldProps
} from "./types"
