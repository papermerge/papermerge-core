import {useGetUsersQuery} from "@/features/users/storage/api"
import {Loader, Select} from "@mantine/core"
import {TFunction} from "i18next"
import {useState} from "react"

interface Args {
  label?: string
  onChange?: (value: string | null) => void
  value?: string
  t?: TFunction
}

export default function LazyUsersSelect({onChange, value, t, label}: Args) {
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
    value: user.id,
    label: user.username
  }))

  const handleDropdownOpen = () => {
    setIsDropdownOpen(true)
  }

  const handleChange = (newValue: string | null) => {
    if (onChange) {
      onChange(newValue)
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
          label: t?.("lazyUsersSelect.error") ?? "Error loading users",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: t?.("lazyUsersSelect.noUsersFound") ?? "No users found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <Select
      data={renderSelectData()}
      value={value}
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
