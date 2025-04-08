import {TextInput} from "@mantine/core"
import {useThrottledCallback} from "@mantine/hooks"
import {IconSearch, IconX} from "@tabler/icons-react"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  onChange: (value: string) => void
  onClear: () => void
  filterText?: string
}

export default function QuickFilter({onChange, onClear, filterText}: Args) {
  const {t} = useTranslation()
  const [localFilterText, setLocalFilterText] = useState<string>()
  const throttledSetValue = useThrottledCallback(
    value => onLocalChange(value),
    1500
  )

  const onLocalClear = () => {
    setLocalFilterText(undefined)
    onClear()
  }

  const onLocalChange = (value: string) => {
    const trimmedValue = value.trim() || ""
    setLocalFilterText(trimmedValue)
    onChange(trimmedValue)
  }

  return (
    <TextInput
      rightSection={
        filterText ? <IconX onClick={onLocalClear} /> : <IconSearch />
      }
      onChange={event => {
        throttledSetValue(event.currentTarget.value)
        setLocalFilterText(event.currentTarget.value)
      }}
      placeholder={t("common.quick_search")}
      value={localFilterText || filterText || ""}
    />
  )
}
