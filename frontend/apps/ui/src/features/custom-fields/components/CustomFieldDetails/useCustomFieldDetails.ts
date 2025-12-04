import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useAuth} from "@/app/hooks/useAuth"
import {useGetCustomFieldQuery} from "@/features/custom-fields/storage/api"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetails} from "@/features/ui/panelRegistry"
import {CUSTOM_FIELD_DELETE, CUSTOM_FIELD_UPDATE} from "@/scopes"
import {formatTimestamp} from "@/utils/formatTime"
import {useCallback, useMemo} from "react"
import type {CustomFieldDetailsActions, CustomFieldDetailsState} from "./types"

interface UseCustomFieldDetailsReturn
  extends CustomFieldDetailsState,
    CustomFieldDetailsActions {}

/**
 * Hook for managing CustomFieldDetails state and logic
 *
 * Handles:
 * - Fetching custom field data
 * - Permission checks
 * - Formatting timestamps
 * - Panel management
 */
export function useCustomFieldDetails(): UseCustomFieldDetailsReturn {
  const dispatch = useAppDispatch()
  const {panelId} = usePanel()
  const {hasPermission} = useAuth()

  // Get custom field ID from panel state
  const customFieldID = useAppSelector(s => selectPanelDetails(s, panelId))

  // Fetch custom field data
  const {data, isLoading, isFetching, error} = useGetCustomFieldQuery(
    customFieldID?.entityId || "",
    {
      skip: !customFieldID
    }
  )

  // Get user preferences for timestamp formatting
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)

  // Format timestamps
  const formattedUpdatedAt = useMemo(() => {
    if (!data?.updated_at) return ""
    return formatTimestamp(data.updated_at, timestamp_format, timezone)
  }, [data?.updated_at, timestamp_format, timezone])

  const formattedCreatedAt = useMemo(() => {
    if (!data?.created_at) return ""
    return formatTimestamp(data.created_at, timestamp_format, timezone)
  }, [data?.created_at, timestamp_format, timezone])

  // Extract usernames
  const updatedByUsername = data?.updated_by?.username || ""
  const createdByUsername = data?.created_by?.username || ""

  // Permission checks
  const canDelete = hasPermission(CUSTOM_FIELD_DELETE)
  const canUpdate = hasPermission(CUSTOM_FIELD_UPDATE)

  // Actions
  const onClose = useCallback(() => {
    dispatch(closeRoleDetailsSecondaryPanel())
  }, [dispatch])

  const onDelete = useCallback(() => {
    // Delete is handled by DeleteCustomFieldButton component
  }, [])

  const onEdit = useCallback(() => {
    // Edit is handled by EditButton component
  }, [])

  return {
    customField: data || null,
    isLoading,
    isFetching,
    hasError: !!error,
    timestampFormat: timestamp_format,
    timezone,
    formattedUpdatedAt,
    formattedCreatedAt,
    updatedByUsername,
    createdByUsername,
    canDelete,
    canUpdate,
    panelId,
    onClose,
    onDelete,
    onEdit
  }
}

export default useCustomFieldDetails
