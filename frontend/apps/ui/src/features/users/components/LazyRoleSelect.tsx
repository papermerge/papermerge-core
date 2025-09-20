import {useGetRolesQuery} from "@/features/roles/storage/api"
import {Loader, MultiSelect} from "@mantine/core"
import {TFunction} from "i18next"
import {useState} from "react"

interface Args {
  label?: string
  onChange?: (values: string[] | null) => void
  selectedRoles?: string[]
  t?: TFunction
}

export default function LazyRoleSelect({
  onChange,
  selectedRoles,
  t,
  label
}: Args) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Only fetch data when dropdown is opened
  const {
    data: roles = [],
    isLoading,
    error
  } = useGetRolesQuery(undefined, {
    skip: !isDropdownOpen
  })

  const selectData = roles.map(role => ({
    value: role.name,
    label: role.name
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
          label: t?.("errorLoadingRoles") ?? "Error loading roles",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: t?.("noRolesFound") ?? "No roles found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <MultiSelect
      data={renderSelectData()}
      value={selectedRoles}
      onChange={handleChange}
      onDropdownOpen={handleDropdownOpen}
      placeholder={t?.("pickValue", {
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
