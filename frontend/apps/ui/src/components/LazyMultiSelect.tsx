import {ComboboxItem, Loader, MultiSelect} from "@mantine/core"
import {TFunction} from "i18next"

interface Args {
  isLoading: boolean
  isError: boolean
  label?: string
  items?: ComboboxItem[]
  onChange?: (values: string[]) => void
  onDropdownOpen?: () => void
  selectedItems?: string[]
  t?: TFunction
}

export default function LazyMultiSelect({
  selectedItems,
  items,
  label,
  isLoading,
  isError,
  onDropdownOpen,
  onChange,
  t
}: Args) {
  const renderSelectData = () => {
    if (isLoading) {
      return [
        {
          value: t?.("loading") ?? "Loading...",
          label: t?.("loading") ?? "Loading...",
          disabled: true
        }
      ]
    }

    if (isError) {
      return [
        {
          value: t?.("error") ?? "Error",
          label: t?.("lazySelect.errorLoadingItems") ?? "Error loading items",
          disabled: true
        }
      ]
    }

    if (items?.length === 0) {
      return [
        {
          value: t?.("empty") ?? "Empty",
          label: t?.("roles.scopeFilter.noScopesFound") ?? "No items found",
          disabled: true
        }
      ]
    }

    return items
  }
  const handleChange = (values: string[]) => {
    if (onChange) {
      onChange(values)
    }
  }

  return (
    <MultiSelect
      data={renderSelectData()}
      value={selectedItems}
      onChange={handleChange}
      onDropdownOpen={onDropdownOpen}
      placeholder={t?.("pickValue") ?? "Pick value"}
      label={label}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      searchable
      clearable
      maxDropdownHeight={200}
    />
  )
}
