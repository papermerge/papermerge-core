import {Skeleton, Stack, Text} from "@mantine/core"
import {useTranslation} from "react-i18next"
import {BooleanField} from "./BooleanField"
import {CategorySelect} from "./CategorySelect"
import {DateField} from "./DateField"
import LongTextField from "./LongTextField"
import {MonetaryField} from "./MonetaryField"
import {MultiSelectField} from "./MultiSelectField"
import {SelectField} from "./SelectField"
import ShortTextField from "./ShortTextField"
import type {CustomFieldsPresentationProps} from "./types"
import {YearMonthField} from "./YearMonthField"

/**
 * Presentation component for CustomFields
 *
 * Renders:
 * - Document type (category) selector with confirmation and recently used
 * - List of custom field inputs based on document type
 * - Loading and error states
 *
 * Pure presentational - all logic is in the container/hooks
 */
export function CustomFieldsPresentation({
  docId,
  customFields,
  documentTypeId,
  documentTypes,
  isLoading,
  isLoadingDocTypes,
  hasError,
  errorMessage,
  onDocumentTypeChange
}: CustomFieldsPresentationProps) {
  const {t} = useTranslation()

  if (isLoading) {
    return (
      <Stack gap="md">
        <Skeleton height={36} />
        <Skeleton height={36} />
        <Skeleton height={36} />
      </Stack>
    )
  }

  return (
    <Stack gap="md" style={{width: "100%"}}>
      {/* Document Type / Category Selector */}
      <CategorySelect
        documentTypes={documentTypes}
        value={documentTypeId}
        onChange={onDocumentTypeChange}
        disabled={isLoadingDocTypes}
      />

      {/* Custom Fields List */}
      {customFields.length > 0 && (
        <Stack gap="sm">
          {customFields.map(cf => (
            <CustomFieldInput
              key={cf.custom_field.id}
              customField={cf}
              documentId={docId}
            />
          ))}
        </Stack>
      )}

      {/* Error Display */}
      {hasError && (
        <Text c="red" size="sm">
          {errorMessage ||
            t("custom_fields.error_loading", {
              defaultValue: "Error loading custom fields"
            })}
        </Text>
      )}
    </Stack>
  )
}

/**
 * Renders the appropriate input component based on custom field type
 */
interface CustomFieldInputProps {
  customField: CustomFieldsPresentationProps["customFields"][0]
  documentId: string
}

function CustomFieldInput({customField, documentId}: CustomFieldInputProps) {
  const typeHandler = customField.custom_field.type_handler

  switch (typeHandler) {
    case "date":
      return <DateField customField={customField} documentId={documentId} />

    case "monetary":
      return <MonetaryField customField={customField} documentId={documentId} />

    case "boolean":
      return <BooleanField customField={customField} documentId={documentId} />

    case "yearmonth":
      return (
        <YearMonthField customField={customField} documentId={documentId} />
      )

    case "select":
      return <SelectField customField={customField} documentId={documentId} />

    case "multiselect":
      return (
        <MultiSelectField customField={customField} documentId={documentId} />
      )

    case "text":
      return <LongTextField customField={customField} documentId={documentId} />

    case "short_text":
    case "integer":
    case "number":
    case "url":
    case "email":
    default:
      // Use TextField for text-like types
      return (
        <ShortTextField customField={customField} documentId={documentId} />
      )
  }
}

export default CustomFieldsPresentation
