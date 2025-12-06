import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"
import {
  useGetDocumentCustomFieldsQuery,
  useUpdateDocumentTypeMutation
} from "@/features/document/store/apiSlice"
import type {CustomFieldWithValue} from "@/types"
import {skipToken} from "@reduxjs/toolkit/query"
import {useCallback, useMemo} from "react"
import type {UseCustomFieldsReturn} from "./types"

interface UseCustomFieldsArgs {
  docId?: string
  groupId?: string
  currentDocumentTypeId?: string | null
}

/**
 * Hook for managing custom fields in document details
 *
 * Handles:
 * - Fetching custom fields for the document
 * - Fetching available document types
 * - Changing document type (which affects available custom fields)
 * - Loading and error states
 */
export function useCustomFields({
  docId,
  groupId,
  currentDocumentTypeId
}: UseCustomFieldsArgs): UseCustomFieldsReturn {
  // Fetch custom fields for this document
  const {
    data: customFieldsData,
    isLoading: isLoadingCustomFields,
    isError: hasCustomFieldsError,
    error: customFieldsError,
    refetch: refetchCustomFields
  } = useGetDocumentCustomFieldsQuery(docId ?? skipToken)

  // Fetch available document types
  const {
    data: documentTypesData = [],
    isLoading: isLoadingDocTypes,
    isSuccess: isDocTypesSuccess
  } = useGetDocumentTypesQuery(groupId)

  // Mutation for changing document type
  const [updateDocumentType] = useUpdateDocumentTypeMutation()

  // Transform custom fields data
  const customFields: CustomFieldWithValue[] = useMemo(() => {
    if (!customFieldsData) return []
    return customFieldsData
  }, [customFieldsData])

  // Transform document types for select dropdown
  const documentTypes = useMemo(() => {
    return documentTypesData.map(dt => ({
      id: dt.id,
      name: dt.name
    }))
  }, [documentTypesData])

  // Derive document type ID from either prop or find matching in loaded types
  const documentTypeId = useMemo(() => {
    if (!currentDocumentTypeId) return null
    if (!isDocTypesSuccess) return null

    const found = documentTypesData.find(dt => dt.id === currentDocumentTypeId)
    return found ? found.id : null
  }, [currentDocumentTypeId, documentTypesData, isDocTypesSuccess])

  // Handle document type change
  const onDocumentTypeChange = useCallback(
    async (newDocumentTypeId: string | null) => {
      if (!docId) return

      const previousDocumentTypeId = currentDocumentTypeId

      try {
        await updateDocumentType({
          document_id: docId,
          invalidatesTags: {
            documentTypeID:
              previousDocumentTypeId || newDocumentTypeId || undefined
          },
          body: {
            document_type_id: newDocumentTypeId
          }
        }).unwrap()

        // Refetch custom fields after type change
        refetchCustomFields()
      } catch (error) {
        console.error("Failed to update document type:", error)
        throw error
      }
    },
    [docId, currentDocumentTypeId, updateDocumentType, refetchCustomFields]
  )

  // Compute loading state
  const isLoading = isLoadingCustomFields || !docId

  // Compute error message
  const errorMessage = useMemo(() => {
    if (!hasCustomFieldsError) return null
    if (
      customFieldsError &&
      typeof customFieldsError === "object" &&
      "data" in customFieldsError
    ) {
      return JSON.stringify((customFieldsError as {data: unknown}).data)
    }
    return "Error loading custom fields"
  }, [hasCustomFieldsError, customFieldsError])

  return {
    customFields,
    documentTypeId,
    documentTypes,
    isLoading,
    isLoadingDocTypes,
    hasError: hasCustomFieldsError,
    errorMessage,
    onDocumentTypeChange
  }
}

export default useCustomFields
