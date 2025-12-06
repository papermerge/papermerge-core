import type {CustomFieldWithValue} from "@/types"

/**
 * Save status for individual custom field inputs
 */
export type SaveStatus = "idle" | "saving" | "saved" | "error"

/**
 * Configuration for different custom field types
 */
export interface MonetaryConfig {
  currency: string
}

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

export interface MultiSelectConfig {
  options: SelectOption[]
  allow_custom?: boolean
  min_selections?: number
  max_selections?: number
  separator?: string
  required?: boolean
}

/**
 * Value types that can be stored in custom fields
 */
export type CustomFieldValue = string | number | boolean | string[] | null

/**
 * Props for auto-save custom field inputs
 */
export interface AutoSaveCustomFieldProps {
  customField: CustomFieldWithValue
  documentId: string
  disabled?: boolean
}

/**
 * Return type for useAutoSaveCustomField hook
 */
export interface UseAutoSaveCustomFieldReturn {
  save: (value: CustomFieldValue) => void
  saveStatus: SaveStatus
  error: string | null
}

/**
 * Props for the CustomFields container
 */
export interface CustomFieldsContainerProps {
  docId: string
  groupId?: string
}

/**
 * State returned by useCustomFields hook
 */
export interface UseCustomFieldsState {
  customFields: CustomFieldWithValue[]
  documentTypeId: string | null
  documentTypes: Array<{id: string; name: string}>
  isLoading: boolean
  isLoadingDocTypes: boolean
  hasError: boolean
  errorMessage: string | null
}

/**
 * Actions returned by useCustomFields hook
 */
export interface UseCustomFieldsActions {
  onDocumentTypeChange: (documentTypeId: string | null) => Promise<void>
}

/**
 * Combined return type for useCustomFields hook
 */
export interface UseCustomFieldsReturn
  extends UseCustomFieldsState,
    UseCustomFieldsActions {}

/**
 * Props for CustomFields presentation component
 */
export interface CustomFieldsPresentationProps extends UseCustomFieldsState {
  docId: string
  onDocumentTypeChange: (value: string | null) => void
}

/**
 * Props for individual field input components
 */
export interface FieldInputProps {
  customField: CustomFieldWithValue
  documentId: string
  disabled?: boolean
}

/**
 * Props for text input field
 */
export interface TextFieldProps extends FieldInputProps {}

/**
 * Props for date input field
 */
export interface DateFieldProps extends FieldInputProps {}

/**
 * Props for monetary input field
 */
export interface MonetaryFieldProps extends FieldInputProps {}

/**
 * Props for boolean input field
 */
export interface BooleanFieldProps extends FieldInputProps {}

/**
 * Props for yearmonth input field
 */
export interface YearMonthFieldProps extends FieldInputProps {}

/**
 * Props for select input field
 */
export interface SelectFieldProps extends FieldInputProps {}

/**
 * Props for multiselect input field
 */
export interface MultiSelectFieldProps extends FieldInputProps {}
