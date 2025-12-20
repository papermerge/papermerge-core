import {Box} from "@mantine/core"
import OwnerSelector from "kommon/src/components/SelectOwner/SelectOwner"
import type {OwnerSelectorContainerProps} from "kommon/src/components/SelectOwner/types"
import {useOwnerSelector} from "./useOwnerSelector"

export default function OwnerSelectorContainer({
  value,
  onChange,
  label = "Owner",
  withLabel = true
}: OwnerSelectorContainerProps) {
  const {
    activeTab,
    isLoading,
    userOptions,
    groupOptions,
    currentOptions,
    setActiveTab,
    handleSelect,
    handleOptionSubmit,
    combobox
  } = useOwnerSelector(value, onChange)

  return (
    <Box w="100%">
      <OwnerSelector
        value={value}
        label={label}
        withLabel={withLabel}
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
    </Box>
  )
}
