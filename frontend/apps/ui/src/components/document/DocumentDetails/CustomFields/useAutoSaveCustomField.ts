import {useUpdateDocumentCustomFieldsMutation} from "@/features/document/store/apiSlice"
import {useCallback, useEffect, useMemo, useRef, useState} from "react"
import type {
  CustomFieldValue,
  SaveStatus,
  UseAutoSaveCustomFieldReturn
} from "./types"

const DEBOUNCE_DELAY_MS = 500

interface UseAutoSaveCustomFieldArgs {
  documentId: string
  fieldId: string
}

/**
 * Hook for auto-saving custom field values with debounce
 *
 * Features:
 * - Debounced saving (500ms delay)
 * - Save status tracking (idle, saving, saved, error)
 * - Auto-reset of "saved" status after 2 seconds
 * - Cleanup on unmount to prevent memory leaks
 * - Cancels pending saves on new input
 */
export function useAutoSaveCustomField({
  documentId,
  fieldId
}: UseAutoSaveCustomFieldArgs): UseAutoSaveCustomFieldReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const [updateCustomFields] = useUpdateDocumentCustomFieldsMutation()

  // Refs for cleanup
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }
    }
  }, [])

  const save = useCallback(
    (value: CustomFieldValue) => {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Clear any pending "saved" reset
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current)
      }

      // Reset error state
      setError(null)

      // Debounce the save
      debounceTimeoutRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return

        setSaveStatus("saving")

        try {
          await updateCustomFields({
            documentID: documentId,
            body: {[fieldId]: value}
          }).unwrap()

          if (!isMountedRef.current) return

          setSaveStatus("saved")

          // Reset to idle after 2 seconds
          savedTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus("idle")
            }
          }, 2000)
        } catch (err) {
          if (!isMountedRef.current) return

          setSaveStatus("error")
          const errorMessage =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "data" in err
                ? JSON.stringify((err as {data: unknown}).data)
                : "Failed to save"
          setError(errorMessage)
        }
      }, DEBOUNCE_DELAY_MS)
    },
    [documentId, fieldId, updateCustomFields]
  )

  return useMemo(
    () => ({
      save,
      saveStatus,
      error
    }),
    [save, saveStatus, error]
  )
}

export default useAutoSaveCustomField
