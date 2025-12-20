import type {useCombobox} from "@mantine/core"
import type {TFunction} from "i18next"

export type OwnerType = "user" | "group"

export interface Owner {
  type: OwnerType
  id: string
  label: string
}

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
  emptyMessage: string
  footerText: string
  setActiveTab: (tab: string) => void
  handleSelect: (val: string, type: "user" | "group") => void
  handleOptionSubmit: (val: string) => void
  combobox: ReturnType<typeof useCombobox>
}

export interface OwnerSelectorViewProps {
  value: Owner | null
  label?: string
  withLabel?: boolean
  isLoading: boolean
  activeTab: string
  userOptions: OwnerOption[]
  groupOptions: OwnerOption[]
  currentOptions: OwnerOption[]
  combobox: ReturnType<typeof useCombobox>
  onTabChange?: (tab: string) => void
  onSelect?: (val: string, type: "user" | "group") => void
  onOptionSubmit?: (val: string) => void
  t?: TFunction
}

export interface OwnerSelectorContainerProps {
  value: Owner | null
  onChange: (owner: Owner) => void
  label?: string
  withLabel?: boolean
}
