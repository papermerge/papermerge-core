import {useContext, useState} from "react"
import {TextInput} from "@mantine/core"
import {useAppDispatch} from "@/app/hooks"
import {IconSearch, IconX} from "@tabler/icons-react"
import {useThrottledCallback} from "@mantine/hooks"

import PanelContext from "@/contexts/PanelContext"
import {filterUpdated} from "@/features/ui/uiSlice"

export default function QuickFilter() {
  const dispatch = useAppDispatch()
  const mode = useContext(PanelContext)
  const [filterText, setFilterText] = useState<string>()
  const throttledSetValue = useThrottledCallback(value => onChange(value), 1500)
  const onClear = () => {
    setFilterText(undefined)
    dispatch(filterUpdated({mode, filter: undefined}))
  }

  const onChange = (value: string) => {
    const trimmedValue = value.trim() || ""
    setFilterText(trimmedValue)
    dispatch(filterUpdated({mode, filter: trimmedValue}))
  }

  return (
    <TextInput
      rightSection={filterText ? <IconX onClick={onClear} /> : <IconSearch />}
      onChange={event => {
        setFilterText(event.currentTarget.value)
        throttledSetValue(event.currentTarget.value)
      }}
      placeholder="Quick search"
      value={filterText || ""}
    />
  )
}
