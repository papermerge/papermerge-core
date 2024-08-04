import {useDispatch} from "react-redux"

import {Checkbox} from "@mantine/core"
import {updateSearchResultItemTarget} from "@/slices/dualPanel/dualPanel"

export default function OpenInOtherPanelCheckbox() {
  const dispatch = useDispatch()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetPanel = event.currentTarget.checked ? "secondary" : "main"
    dispatch(updateSearchResultItemTarget(targetPanel))
  }
  return (
    <Checkbox onChange={onChange} defaultChecked label="Open in other panel" />
  )
}
