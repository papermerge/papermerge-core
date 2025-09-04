import {useGetUsersQuery} from "@/features/users/apiSlice"
import {Loader, MultiSelect} from "@mantine/core"
import {TFunction} from "i18next"
import {useState} from "react"

interface Args {
  onChange?: (values: string[] | null) => void
  selectedUsers?: string[]
  t?: TFunction
}

export default function LazyUserSelect({onChange, selectedUsers, t}: Args) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Only fetch data when dropdown is opened
  const {
    data: users = [],
    isLoading,
    error
  } = useGetUsersQuery(undefined, {
    skip: !isDropdownOpen // Skip the query until dropdown is opened
  })

  // Transform users data for Select component
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
          label: t?.("auditLog.userFilter.loading") || "Loading...",
          disabled: true
        }
      ]
    }

    if (error) {
      return [
        {
          value: "error",
          label: t?.("auditLog.userFilter.error") || "Error loading users",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: t?.("auditLog.userFilter.noUsersFound") || "No users found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <MultiSelect
      data={renderSelectData()}
      value={selectedUsers}
      onChange={handleChange}
      onDropdownOpen={handleDropdownOpen}
      placeholder={t?.("auditLog.userFilter.pickValue") || "Pick value"}
      label={t?.("auditLog.userFilter.label") || "User"}
      rightSection={isLoading ? <Loader size="xs" /> : undefined}
      searchable
      clearable
      maxDropdownHeight={200}
    />
  )
}
