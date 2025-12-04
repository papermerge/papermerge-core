import type {CustomFieldItem} from "@/features/custom-fields/types"
import type {PanelMode} from "@/types"
import type {TFunction} from "i18next"

export interface SelectOption {
  value: string
  label: string
  color?: string
  icon?: string
  description?: string
}

export interface CustomFieldConfig {
  currency?: string
  options?: SelectOption[]
  allow_custom?: boolean
  min_selections?: number
  max_selections?: number
  [key: string]: unknown
}

export interface CustomFieldFormState {
  id: string
  name: string
  typeHandler: string
  ownerName: string
  owner: CustomFieldItem["owned_by"] | null
  config: CustomFieldConfig
  isSelectType: boolean
}

export interface CustomFieldFormProps extends CustomFieldFormState {
  t?: TFunction
}

export interface CustomFieldDetailsState {
  customField: CustomFieldItem | null
  isLoading: boolean
  isFetching: boolean
  hasError: boolean
  timestampFormat: string
  timezone: string
  formattedUpdatedAt: string
  formattedCreatedAt: string
  updatedByUsername: string
  createdByUsername: string
  canDelete: boolean
  canUpdate: boolean
  panelId: PanelMode
}

export interface CustomFieldDetailsActions {
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
}

export interface CustomFieldDetailsProps
  extends CustomFieldDetailsState,
    CustomFieldDetailsActions {}

export interface PathProps {
  customFieldName: string
  customFieldId: string
  panelId: PanelMode
  isNavigating: boolean
  t: TFunction
}
