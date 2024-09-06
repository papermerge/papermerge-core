import {useContext, useState} from "react"
import {TextInput} from "@mantine/core"
import {useAppDispatch} from "@/app/hooks"
import {IconSearch, IconX} from "@tabler/icons-react"
import {useThrottledCallback} from "@mantine/hooks"

import PanelContext from "@/contexts/PanelContext"
import {filterUpdated} from "@/slices/dualPanel/dualPanel"

export default function QuickFilter() {
  const dispatch = useAppDispatch()
  const mode = useContext(PanelContext)
  const [filterText, setFilterText] = useState<string | null>(null)
  const throttledSetValue = useThrottledCallback(value => onChange(value), 1500)
  const onClear = () => {
    setFilterText(null)
    dispatch(filterUpdated({mode, filter: null}))
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
