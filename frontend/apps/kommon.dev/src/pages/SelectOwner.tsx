import {useState} from "react"
import {useCombobox, Stack, Checkbox} from "@mantine/core"
import type {
  Owner,
  OwnerOption,
  OwnerType
} from "kommon/src/components/SelectOwner/types"

import SelectOwner from "kommon/src/components/SelectOwner/SelectOwner"

export default function SelectOwnerPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null)
  const [activeTab, setActiveTab] = useState<string>("users")

  // Initialize combobox
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  // Static user data
  const userOptions: OwnerOption[] = [
    {
      value: "user-1",
      label: "John Doe (Me)",
      type: "user"
    },
    {
      value: "user-2",
      label: "Jane Smith",
      type: "user"
    },
    {
      value: "user-3",
      label: "Bob Johnson",
      type: "user"
    }
  ]

  // Static group data
  const groupOptions: OwnerOption[] = [
    {
      value: "group-1",
      label: "Engineering Team",
      type: "group"
    },
    {
      value: "group-2",
      label: "Design Team",
      type: "group"
    },
    {
      value: "group-3",
      label: "Product Team",
      type: "group"
    }
  ]

  // Get current options based on active tab
  const currentOptions = activeTab === "users" ? userOptions : groupOptions

  // Handle selection
  const handleSelect = (val: string, type: OwnerType) => {
    const option = currentOptions.find(o => o.value === val)
    if (option) {
      setSelectedOwner({
        type: option.type,
        id: option.value,
        label: option.label
      })
    }
    combobox.closeDropdown()
  }

  // Handle option submit (from keyboard navigation)
  const handleOptionSubmit = (val: string) => {
    const option = currentOptions.find(o => o.value === val)
    if (option) {
      handleSelect(val, option.type)
    }
  }

  return (
    <Stack>
      <SelectOwner
        value={selectedOwner}
        isLoading={isLoading}
        activeTab={activeTab}
        userOptions={userOptions}
        groupOptions={groupOptions}
        currentOptions={currentOptions}
        combobox={combobox}
        onTabChange={setActiveTab}
        onSelect={handleSelect}
        onOptionSubmit={handleOptionSubmit}
      />
      <Checkbox label="Loading" onClick={() => setIsLoading(!isLoading)} />
    </Stack>
  )
}
