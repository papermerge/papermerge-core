import {SelectOptionsPresentation} from "./SelectOptions.presentation"
import type {SelectOption} from "./types"
import {useSelectOptions} from "./useSelectOptions"

interface SelectOptionsContainerProps {
  /**
   * Callback when options change - parent receives validated options
   */
  onChange: (options: SelectOption[]) => void
  /**
   * Initial options to populate the editor
   */
  initialOptions?: SelectOption[]
  /**
   * Whether the editor is disabled
   */
  disabled?: boolean
}

/**
 * Container component for select/multiselect options editor
 *
 * Connects the useSelectOptions hook with the presentation component.
 * Notifies parent of changes through onChange callback.
 */
export function SelectOptionsContainer({
  onChange,
  initialOptions,
  disabled = false
}: SelectOptionsContainerProps) {
  const {
    options,
    addOption,
    removeOption,
    updateOptionLabel,
    updateOptionValue,
    getValidOptions
  } = useSelectOptions({initialOptions})

  const handleAddOption = () => {
    addOption()
  }

  const handleRemoveOption = (index: number) => {
    removeOption(index)
    // Notify parent of change after removal
    const remaining = options.filter((_, i) => i !== index)
    const valid = remaining.filter(opt => opt.value.trim() && opt.label.trim())
    onChange(valid)
  }

  const handleLabelChange = (index: number, label: string) => {
    updateOptionLabel(index, label)
    // We need to compute what the options will be after this update
    const newOptions = [...options]
    newOptions[index] = {...newOptions[index], label}
    if (!newOptions[index].value) {
      newOptions[index].value = label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
    }
    const valid = newOptions.filter(opt => opt.value.trim() && opt.label.trim())
    onChange(valid)
  }

  const handleValueChange = (index: number, value: string) => {
    updateOptionValue(index, value)
    const newOptions = [...options]
    newOptions[index] = {...newOptions[index], value}
    const valid = newOptions.filter(opt => opt.value.trim() && opt.label.trim())
    onChange(valid)
  }

  return (
    <SelectOptionsPresentation
      options={options}
      onAddOption={handleAddOption}
      onRemoveOption={handleRemoveOption}
      onOptionLabelChange={handleLabelChange}
      onOptionValueChange={handleValueChange}
      disabled={disabled}
    />
  )
}

export default SelectOptionsContainer
