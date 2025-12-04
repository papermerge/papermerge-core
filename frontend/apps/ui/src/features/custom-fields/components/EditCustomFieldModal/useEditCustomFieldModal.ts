import {useAppSelector} from "@/app/hooks"
import type {SelectOption} from "@/features/custom-fields/components/SelectOptions"
import {
  useEditCustomFieldMutation,
  useGetCustomFieldQuery
} from "@/features/custom-fields/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import type {
  CurrencyType,
  CustomFieldDataType,
  CustomFieldUpdate,
  Owner
} from "@/types"
import {extractApiError} from "@/utils/errorHandling"
import {useCallback, useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

interface UseEditCustomFieldModalArgs {
  customFieldId: string
  onSubmit: () => void
}

interface UseEditCustomFieldModalReturn {
  // Form state
  name: string
  dataType: CustomFieldDataType
  currency: CurrencyType
  owner: Owner
  selectOptions: SelectOption[]
  error: string

  // Query/Mutation state
  isLoading: boolean
  isUpdating: boolean
  isDataLoaded: boolean

  // Computed
  isSelectType: boolean

  // Actions
  onNameChange: (value: string) => void
  onDataTypeChange: (value: CustomFieldDataType) => void
  onCurrencyChange: (value: string | null) => void
  onOwnerChange: (newOwner: Owner) => void
  onSelectOptionsChange: (options: SelectOption[]) => void
  onLocalSubmit: () => Promise<void>
  formReset: () => void
}

/**
 * Hook for managing EditCustomFieldModal state and logic
 *
 * Handles:
 * - Fetching existing custom field data
 * - Form state management
 * - Config building for different field types
 * - API mutation for updates
 * - Form reset
 */
export function useEditCustomFieldModal({
  customFieldId,
  onSubmit
}: UseEditCustomFieldModalArgs): UseEditCustomFieldModalReturn {
  const currentUser = useAppSelector(selectCurrentUser)
  const {t} = useTranslation()

  // Fetch existing custom field data
  const {data, isLoading} = useGetCustomFieldQuery(customFieldId)
  const [updateCustomField, {isLoading: isUpdating}] =
    useEditCustomFieldMutation()

  // Form state
  const [name, setName] = useState<string>("")
  const [dataType, setDataType] = useState<CustomFieldDataType>("text")
  const [currency, setCurrency] = useState<CurrencyType>("EUR")
  const [error, setError] = useState<string>("")
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([])
  const [owner, setOwner] = useState<Owner>({
    id: currentUser?.id || "",
    type: "user",
    label: "Me"
  })

  // Parse config from loaded data
  const parseConfigFromData = useCallback(() => {
    if (!data?.config) return

    const config = data.config as Record<string, unknown>

    // Parse currency for monetary type
    if (data.type_handler === "monetary" && config.currency) {
      setCurrency(config.currency as CurrencyType)
    }

    // Parse options for select/multiselect types
    if (
      (data.type_handler === "select" || data.type_handler === "multiselect") &&
      Array.isArray(config.options)
    ) {
      setSelectOptions(config.options as SelectOption[])
    }
  }, [data])

  // Initialize form with loaded data
  const formReset = useCallback(() => {
    if (data) {
      setName(data.name || "")
      setDataType((data.type_handler as CustomFieldDataType) || "text")
      setError("")

      // Set owner
      if (data.owned_by && data.owned_by.type === "group") {
        setOwner({
          id: data.owned_by.id,
          type: "group",
          label: data.owned_by.name
        })
      } else {
        setOwner({
          id: currentUser?.id || "",
          type: "user",
          label: "Me"
        })
      }

      // Parse type-specific config
      parseConfigFromData()
    }
  }, [data, currentUser?.id, parseConfigFromData])

  // Reset form when data loads or changes
  useEffect(() => {
    formReset()
  }, [formReset])

  // Computed
  const isSelectType = dataType === "select" || dataType === "multiselect"
  const isDataLoaded = !isLoading && data != null

  // Actions
  const onNameChange = useCallback((value: string) => {
    setName(value)
  }, [])

  const onDataTypeChange = useCallback((value: CustomFieldDataType) => {
    setDataType(value)
    // Reset select options when switching away from select types
    if (value !== "select" && value !== "multiselect") {
      setSelectOptions([])
    }
  }, [])

  const onCurrencyChange = useCallback((value: string | null) => {
    setCurrency((value as CurrencyType) ?? "EUR")
  }, [])

  const onOwnerChange = useCallback((newOwner: Owner) => {
    setOwner(newOwner)
  }, [])

  const onSelectOptionsChange = useCallback((options: SelectOption[]) => {
    setSelectOptions(options)
  }, [])

  const buildConfig = useCallback(() => {
    if (dataType === "monetary") {
      return {currency}
    }

    if (dataType === "select") {
      return {
        options: selectOptions,
        allow_custom: false
      }
    }

    if (dataType === "multiselect") {
      return {
        options: selectOptions,
        allow_custom: false
      }
    }

    return {}
  }, [dataType, currency, selectOptions])

  const onLocalSubmit = useCallback(async () => {
    const config = buildConfig()

    const updatedData: CustomFieldUpdate = {
      id: customFieldId,
      name,
      type_handler: dataType,
      config
    }

    // Add group_id if owner is a group
    if (owner.type === "group" && owner.id) {
      updatedData.owner_id = owner.id
      updatedData.owner_type = "group"
    }

    try {
      await updateCustomField(updatedData).unwrap()
      onSubmit()
    } catch (err: unknown) {
      setError(
        extractApiError(
          err,
          t("document_types.form.error", {
            defaultValue: "Failed to create document type"
          })
        )
      )
    }
  }, [
    customFieldId,
    name,
    dataType,
    owner,
    buildConfig,
    updateCustomField,
    onSubmit
  ])

  return {
    name,
    dataType,
    currency,
    owner,
    selectOptions,
    error,
    isLoading,
    isUpdating,
    isDataLoaded,
    isSelectType,
    onNameChange,
    onDataTypeChange,
    onCurrencyChange,
    onOwnerChange,
    onSelectOptionsChange,
    onLocalSubmit,
    formReset
  }
}

export default useEditCustomFieldModal
