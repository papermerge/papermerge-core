import {useGetAllScopesQuery} from "@/features/roles/storage/api"
import {Loader, MultiSelect} from "@mantine/core"
import {TFunction} from "i18next"
import {useState} from "react"

interface Args {
  label?: string
  onChange?: (values: string[] | null) => void
  selectedScopes?: string[]
  t?: TFunction
}

export default function LazyScopeSelect({
  onChange,
  selectedScopes,
  t,
  label
}: Args) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Only fetch data when dropdown is opened
  const {
    data: scopes = [],
    isLoading,
    error
  } = useGetAllScopesQuery(undefined, {
    skip: !isDropdownOpen
  })

  const selectData = scopes.map(scope => ({
    value: scope,
    label: t?.(`scopes.${scope}`) ?? scope
  }))

  const handleDropdownOpen = () => {
    setIsDropdownOpen(true)
  }

  const handleChange = (values: string[]) => {
    if (onChange) {
      onChange(values)
    }
  }

  const renderSelectData = () => {
    if (isLoading) {
      return [
        {
          value: "loading",
          label: t?.("loading") ?? "Loading...",
          disabled: true
        }
      ]
    }

    if (error) {
      return [
        {
          value: "error",
          label: t?.("roles.scopeFilter.error") ?? "Error loading scopes",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: t?.("roles.scopeFilter.noScopesFound") ?? "No scopes found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <MultiSelect
      data={renderSelectData()}
      value={selectedScopes}
      onChange={handleChange}
      onDropdownOpen={handleDropdownOpen}
      placeholder={t?.("roles.scopeFilter.pickValue", {
        defaultValue: "Pick value"
      })}
      label={label}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      searchable
      clearable
      maxDropdownHeight={200}
    />
  )
}
