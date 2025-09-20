import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {Loader, MultiSelect} from "@mantine/core"
import {TFunction} from "i18next"
import {useState} from "react"

interface Args {
  label?: string
  onChange?: (values: string[] | null) => void
  selectedGroups?: string[]
  t?: TFunction
}

export default function LazyGroupSelect({
  onChange,
  selectedGroups,
  t,
  label
}: Args) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Only fetch data when dropdown is opened
  const {
    data: groups = [],
    isLoading,
    error
  } = useGetGroupsQuery(undefined, {
    skip: !isDropdownOpen
  })

  const selectData = groups.map(group => ({
    value: group.name,
    label: group.name
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
          label: t?.("errorLoadingGroups") ?? "Error loading groups",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: t?.("noGroupsFound") ?? "No groups found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <MultiSelect
      data={renderSelectData()}
      value={selectedGroups}
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
