import {useDispatch} from "react-redux"

import {searchResultItemTargetUpdated} from "@/features/ui/uiSlice"
import {Checkbox} from "@mantine/core"

export default function OpenInOtherPanelCheckbox() {
  const dispatch = useDispatch()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inOtherPanel = Boolean(event.currentTarget.checked)
    dispatch(searchResultItemTargetUpdated(inOtherPanel))
  }

  return (
    <Checkbox onChange={onChange} defaultChecked label="Open in other panel" />
  )
}
