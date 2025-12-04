import type {CustomFieldItem} from "@/features/custom-fields/types"
import {useMemo} from "react"
import type {CustomFieldConfig, CustomFieldFormState} from "./types"

interface UseCustomFieldFormArgs {
  customField: CustomFieldItem | null
}

/**
 * Hook for extracting and processing custom field form data
 *
 * Handles:
 * - Extracting basic field properties
 * - Parsing config for different field types
 * - Determining if field is select/multiselect type
 */
export function useCustomFieldForm({
  customField
}: UseCustomFieldFormArgs): CustomFieldFormState {
  // Parse config from custom field
  const config = useMemo((): CustomFieldConfig => {
    if (!customField?.config) return {}
    return customField.config as CustomFieldConfig
  }, [customField?.config])

  // Determine if this is a select type
  const isSelectType = useMemo(() => {
    const typeHandler = customField?.type_handler || ""
    return typeHandler === "select" || typeHandler === "multiselect"
  }, [customField?.type_handler])

  return {
    id: customField?.id || "",
    name: customField?.name || "",
    typeHandler: customField?.type_handler || "",
    ownerName: customField?.owned_by?.name || "Me",
    owner: customField?.owned_by || null,
    config,
    isSelectType
  }
}

export default useCustomFieldForm
