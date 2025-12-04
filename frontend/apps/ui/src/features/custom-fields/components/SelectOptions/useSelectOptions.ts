import {useCallback, useState} from "react"
import type {SelectOption} from "./types"

interface UseSelectOptionsArgs {
  initialOptions?: SelectOption[]
}

interface UseSelectOptionsReturn {
  options: SelectOption[]
  setOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>
  addOption: () => void
  removeOption: (index: number) => void
  updateOptionLabel: (index: number, label: string) => void
  updateOptionValue: (index: number, value: string) => void
  getValidOptions: () => SelectOption[]
  reset: () => void
}

const DEFAULT_OPTIONS: SelectOption[] = [{value: "", label: ""}]

/**
 * Hook for managing select/multiselect options state and logic
 *
 * Handles:
 * - Adding/removing options
 * - Updating option values
 * - Auto-generating value from label
 * - Filtering valid options for submission
 */
export function useSelectOptions({
  initialOptions = DEFAULT_OPTIONS
}: UseSelectOptionsArgs = {}): UseSelectOptionsReturn {
  const [options, setOptions] = useState<SelectOption[]>(initialOptions)

  const addOption = useCallback(() => {
    setOptions(prev => [...prev, {value: "", label: ""}])
  }, [])

  const removeOption = useCallback((index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateOptionLabel = useCallback((index: number, label: string) => {
    setOptions(prev => {
      const newOptions = [...prev]
      newOptions[index] = {
        ...newOptions[index],
        label
      }
      // Auto-fill value from label if value is empty
      if (!newOptions[index].value) {
        newOptions[index].value = label
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
      }
      return newOptions
    })
  }, [])

  const updateOptionValue = useCallback((index: number, value: string) => {
    setOptions(prev => {
      const newOptions = [...prev]
      newOptions[index] = {
        ...newOptions[index],
        value
      }
      return newOptions
    })
  }, [])

  const getValidOptions = useCallback(() => {
    return options.filter(opt => opt.value.trim() && opt.label.trim())
  }, [options])

  const reset = useCallback(() => {
    setOptions(DEFAULT_OPTIONS)
  }, [])

  return {
    options,
    setOptions,
    addOption,
    removeOption,
    updateOptionLabel,
    updateOptionValue,
    getValidOptions,
    reset
  }
}

export default useSelectOptions
