import {useOwnerSelector} from "./useOwnerSelector"
import OwnerSelector from "kommon/src/components/SelectOwner/SelectOwner"
import type {OwnerSelectorContainerProps} from "kommon/src/components/SelectOwner/types"

export default function OwnerSelectorContainer({
  value,
  onChange,
  label = "Owner"
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
    <OwnerSelector
      value={value}
      label={label}
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
  )
}
