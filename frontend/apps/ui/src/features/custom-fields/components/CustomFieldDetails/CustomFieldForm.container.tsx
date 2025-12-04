import type {CustomFieldItem} from "@/features/custom-fields/types"
import type {TFunction} from "i18next"
import {CustomFieldFormPresentation} from "./CustomFieldForm.presentation"
import {useCustomFieldForm} from "./useCustomFieldForm"

interface CustomFieldFormContainerProps {
  customField: CustomFieldItem | null
  t?: TFunction
}

/**
 * Container component for CustomFieldForm
 *
 * Connects the useCustomFieldForm hook with the presentation component.
 * Displays readonly custom field details.
 */
export function CustomFieldFormContainer({
  customField,
  t
}: CustomFieldFormContainerProps) {
  const formState = useCustomFieldForm({customField})

  return <CustomFieldFormPresentation {...formState} t={t} />
}

export default CustomFieldFormContainer
