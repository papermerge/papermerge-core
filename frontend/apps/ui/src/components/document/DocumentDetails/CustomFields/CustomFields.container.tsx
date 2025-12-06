import type {DocumentType} from "@/features/document/types"
import {Skeleton} from "@mantine/core"
import {useCallback} from "react"
import {CustomFieldsPresentation} from "./CustomFields.presentation"
import {useCustomFields} from "./useCustomFields"

interface CustomFieldsContainerProps {
  doc?: DocumentType
  docID?: string
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
  docID,
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
    docId: docID,
    groupId: undefined,
    currentDocumentTypeId: doc?.id
  })

  // Handle document type change from Select component
  const handleDocumentTypeChange = useCallback(
    (value: string | null) => {
      onDocumentTypeChange(value)
    },
    [onDocumentTypeChange]
  )

  // Show loading state if document is still loading
  if (isDocLoading || !docID || !doc) {
    return <Skeleton height={120} />
  }

  return (
    <CustomFieldsPresentation
      docId={docID}
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
