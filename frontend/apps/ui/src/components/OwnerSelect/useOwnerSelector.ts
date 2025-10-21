import {useState, useMemo} from "react"
import {useCombobox} from "@mantine/core"
import type {Owner} from "@/types"
import {
  useGetUserGroupHomesQuery,
  useGetUserGroupUsersQuery
} from "@/features/users/storage/api"
import {useAppSelector} from "@/app/hooks"
import {selectCurrentUser} from "@/slices/currentUser"

export interface OwnerOption {
  value: string
  label: string
  type: "user" | "group"
}

export interface UseOwnerSelectorReturn {
  activeTab: string
  isLoading: boolean
  userOptions: OwnerOption[]
  groupOptions: OwnerOption[]
  currentOptions: OwnerOption[]
  setActiveTab: (tab: string) => void
  handleSelect: (val: string, type: "user" | "group") => void
  handleOptionSubmit: (val: string) => void
  combobox: ReturnType<typeof useCombobox>
}

export function useOwnerSelector(
  value: Owner | null,
  onChange: (owner: Owner) => void
): UseOwnerSelectorReturn {
  const currentUser = useAppSelector(selectCurrentUser)
  const {data: groups = [], isLoading: isLoadingGroups} =
    useGetUserGroupHomesQuery()
  const {data: users = [], isLoading: isLoadingUsers} =
    useGetUserGroupUsersQuery()

  const [activeTab, setActiveTab] = useState<string>("users")
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const isLoading = isLoadingGroups || isLoadingUsers

  // Prepare user options
  const userOptions = useMemo<OwnerOption[]>(
    () => [
      {
        value: currentUser?.id || "",
        label: `${currentUser?.username} (Me)`,
        type: "user"
      },
      ...users.map(user => ({
        value: user.id,
        label: user.username,
        type: "user" as const
      }))
    ],
    [currentUser, users]
  )

  // Prepare group options
  const groupOptions = useMemo<OwnerOption[]>(
    () =>
      groups.map(group => ({
        value: group.group_id,
        label: group.group_name,
        type: "group"
      })),
    [groups]
  )

  const currentOptions = activeTab === "users" ? userOptions : groupOptions

  const handleSelect = (val: string, type: "user" | "group") => {
    const option =
      type === "user"
        ? userOptions.find(o => o.value === val)
        : groupOptions.find(o => o.value === val)

    if (option) {
      onChange({
        type: option.type,
        id: option.value,
        label: option.label
      })
    }
    combobox.closeDropdown()
  }

  const handleOptionSubmit = (val: string) => {
    const option = currentOptions.find(o => o.value === val)
    if (option) {
      handleSelect(val, option.type)
    }
  }

  return {
    activeTab,
    isLoading,
    userOptions,
    groupOptions,
    currentOptions,
    setActiveTab,
    handleSelect,
    handleOptionSubmit,
    combobox
  }
}
