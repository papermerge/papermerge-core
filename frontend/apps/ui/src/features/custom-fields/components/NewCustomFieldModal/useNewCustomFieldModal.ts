import {useAppSelector} from "@/app/hooks"
import type {SelectOption} from "@/features/custom-fields/components/SelectOptions"
import {useAddNewCustomFieldMutation} from "@/features/custom-fields/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import type {CurrencyType, CustomFieldDataType, Owner} from "@/types"
import {extractApiError} from "@/utils/errorHandling"
import {useCallback, useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

interface UseNewCustomFieldModalArgs {
  onSubmit: () => void
}

interface UseNewCustomFieldModalReturn {
  // Form state
  name: string
  dataType: CustomFieldDataType
  currency: CurrencyType
  owner: Owner
  selectOptions: SelectOption[]
  error: string

  // Mutation state
  isLoading: boolean
  isError: boolean

  // Computed
  isSelectType: boolean

  // Actions
  onNameChange: (value: string) => void
  onDataTypeChange: (value: CustomFieldDataType) => void
  onCurrencyChange: (value: string | null) => void
  onOwnerChange: (newOwner: Owner) => void
  onSelectOptionsChange: (options: SelectOption[]) => void
  onLocalSubmit: () => Promise<void>
  reset: () => void
}

/**
 * Hook for managing NewCustomFieldModal state and logic
 *
 * Handles:
 * - Form state management
 * - Config building for different field types
 * - API mutation
 * - Form reset
 */
export function useNewCustomFieldModal({
  onSubmit
}: UseNewCustomFieldModalArgs): UseNewCustomFieldModalReturn {
  const currentUser = useAppSelector(selectCurrentUser)
  const {t} = useTranslation()

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

  // API mutation
  const [addNewCustomField, {isLoading, isError, isSuccess}] =
    useAddNewCustomFieldMutation()

  // Close dialog on success
  useEffect(() => {
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  // Computed
  const isSelectType = dataType === "select" || dataType === "multiselect"

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

    const newCustomFieldData = {
      name,
      config,
      owner_type: owner.type,
      owner_id: owner.id,
      type_handler: dataType
    }

    try {
      await addNewCustomField(newCustomFieldData).unwrap()
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
  }, [name, owner, dataType, buildConfig, addNewCustomField])

  const reset = useCallback(() => {
    setName("")
    setDataType("text")
    setCurrency("EUR")
    setError("")
    setSelectOptions([])
    setOwner({
      label: "Me",
      id: currentUser?.id || "",
      type: "user"
    })
  }, [currentUser?.id])

  return {
    name,
    dataType,
    currency,
    owner,
    selectOptions,
    error,
    isLoading,
    isError,
    isSelectType,
    onNameChange,
    onDataTypeChange,
    onCurrencyChange,
    onOwnerChange,
    onSelectOptionsChange,
    onLocalSubmit,
    reset
  }
}

export default useNewCustomFieldModal
