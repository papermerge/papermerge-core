import {CustomFieldDetailsPresentation} from "./CustomFieldDetails.presentation"
import {useCustomFieldDetails} from "./useCustomFieldDetails"

/**
 * Container component for CustomFieldDetails
 *
 * Connects the useCustomFieldDetails hook with the presentation component.
 * Displays readonly custom field details with audit information.
 */
export function CustomFieldDetailsContainer() {
  const detailsState = useCustomFieldDetails()

  return <CustomFieldDetailsPresentation {...detailsState} />
}

export default CustomFieldDetailsContainer
