import type {DocumentType} from "@/features/document/types"
import {Skeleton} from "@mantine/core"
import {useCallback} from "react"
import {CustomFieldsPresentation} from "./CustomFields.presentation"
import {useCustomFields} from "./useCustomFields"

interface CustomFieldsContainerProps {
  doc?: DocumentType
  isLoading: boolean
}

/**
 * Container component for CustomFields
 *
 * Connects the useCustomFields hook with the presentation component.
 * Handles document type changes and manages custom field state.
 */
export function CustomFieldsContainer({
  doc,
  isLoading: isDocLoading
}: CustomFieldsContainerProps) {
  const {
    customFields,
    documentTypeId,
    documentTypes,
    isLoading: isCustomFieldsLoading,
    isLoadingDocTypes,
    hasError,
    errorMessage,
    onDocumentTypeChange
  } = useCustomFields({
    docId: doc?.id,
    groupId: undefined,
    currentDocumentTypeId: doc?.document_type_id
  })

  // Handle document type change from Select component
  const handleDocumentTypeChange = useCallback(
    (value: string | null) => {
      onDocumentTypeChange(value)
    },
    [onDocumentTypeChange]
  )

  // Show loading state if document is still loading
  if (isDocLoading || !doc) {
    return <Skeleton height={120} />
  }

  return (
    <CustomFieldsPresentation
      docId={doc.id}
      customFields={customFields}
      documentTypeId={documentTypeId}
      documentTypes={documentTypes}
      isLoading={isCustomFieldsLoading}
      isLoadingDocTypes={isLoadingDocTypes}
      hasError={hasError}
      errorMessage={errorMessage}
      onDocumentTypeChange={handleDocumentTypeChange}
    />
  )
}

export default CustomFieldsContainer
