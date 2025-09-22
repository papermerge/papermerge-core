import {useGetUsersQuery} from "@/features/users/storage/api"
import {Loader, MultiSelect} from "@mantine/core"
import {TFunction} from "i18next"
import {useState} from "react"

interface Args {
  label?: string
  onChange?: (values: string[] | null) => void
  selectedScopes?: string[]
  t?: TFunction
}

export default function LazyUsersSelect({
  onChange,
  selectedScopes,
  t,
  label
}: Args) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Only fetch data when dropdown is opened
  const {
    data: users = [],
    isLoading,
    error
  } = useGetUsersQuery(undefined, {
    skip: !isDropdownOpen
  })

  const selectData = users.map(user => ({
    value: user.username,
    label: user.username
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
          label: t?.("usersSelect.error") ?? "Error loading users",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: t?.("usersSelect.noUsersFound") ?? "No users found",
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
