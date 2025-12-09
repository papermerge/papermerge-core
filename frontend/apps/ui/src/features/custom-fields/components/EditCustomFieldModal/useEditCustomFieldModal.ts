import {useAppSelector} from "@/app/hooks"
import type {SelectOption} from "@/features/custom-fields/components/SelectOptions"
import {
  useEditCustomFieldMutation,
  useGetCustomFieldQuery,
  useLazyGetCustomFieldTypeSelectUsageCountQuery
} from "@/features/custom-fields/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import type {
  CurrencyType,
  CustomFieldDataType,
  CustomFieldUpdate,
  Owner
} from "@/types"
import {extractApiError} from "@/utils/errorHandling"
import {useDebouncedCallback} from "@mantine/hooks"
import {useCallback, useEffect, useRef, useState} from "react"
import {useTranslation} from "react-i18next"

import type {OptionValuesChangesTotal} from "./types"
import {
  changedValueOptionList,
  haveValueOptionChanged,
  isSelect,
  wrapOptionValueChanges
} from "./utils"

interface UseEditCustomFieldModalArgs {
  customFieldId: string
  onSubmit: () => void
}

interface UseEditCustomFieldModalReturn {
  optionValuesChangesTotal: OptionValuesChangesTotal | null
  isCheckingMigration: boolean
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

const DEBOUNCE_MS = 1500

/**
 * Hook for managing EditCustomFieldModal state and logic
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
  const [getOptionUsageCount, {isFetching: isCheckingMigration}] =
    useLazyGetCustomFieldTypeSelectUsageCountQuery()

  // Form state
  const [optionValuesChangesTotal, setOptionValuesChangesTotal] =
    useState<OptionValuesChangesTotal | null>(null)
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

  // Track the latest request to avoid race conditions
  const latestRequestRef = useRef<number>(0)

  // Check migration impact (called with debounce)
  const checkMigrationImpact = useCallback(
    async (currentOptions: SelectOption[]) => {
      if (!data || !isSelect(data)) {
        setOptionValuesChangesTotal(null)
        return
      }

      if (!haveValueOptionChanged(currentOptions, data)) {
        setOptionValuesChangesTotal(null)
        return
      }

      const changedOptions = changedValueOptionList(currentOptions, data)
      const changedValues = changedOptions.map(opt => opt.old_value)

      const requestId = ++latestRequestRef.current

      try {
        const result = await getOptionUsageCount({
          field_id: customFieldId,
          values: changedValues
        }).unwrap()

        // Ignore if a newer request was made
        if (requestId !== latestRequestRef.current) {
          return
        }

        const wrapped = wrapOptionValueChanges({
          counts: result,
          mappings: changedOptions
        })

        setOptionValuesChangesTotal(wrapped)
      } catch (err: unknown) {
        // Ignore if a newer request was made
        if (requestId !== latestRequestRef.current) {
          return
        }

        setError(
          extractApiError(
            err,
            t("customField.form.error", {
              defaultValue: "Failed to retrieve option usage count"
            })
          )
        )
      }
    },
    [data, customFieldId, getOptionUsageCount, t]
  )

  // Debounced version of checkMigrationImpact
  const debouncedCheckMigration = useDebouncedCallback(
    checkMigrationImpact,
    DEBOUNCE_MS
  )

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
      setOptionValuesChangesTotal(null)

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
      setOptionValuesChangesTotal(null)
    }
  }, [])

  const onCurrencyChange = useCallback((value: string | null) => {
    setCurrency((value as CurrencyType) ?? "EUR")
  }, [])

  const onOwnerChange = useCallback((newOwner: Owner) => {
    setOwner(newOwner)
  }, [])

  const onSelectOptionsChange = useCallback(
    (options: SelectOption[]) => {
      setSelectOptions(options)
      // Trigger debounced migration check
      debouncedCheckMigration(options)
    },
    [debouncedCheckMigration]
  )

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
          t("customField.form.error", {
            defaultValue: "Failed to update metadata field"
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
    onSubmit,
    t
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
    isCheckingMigration,
    optionValuesChangesTotal,
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
