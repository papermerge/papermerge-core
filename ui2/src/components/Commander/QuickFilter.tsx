import {TextInput} from "@mantine/core"
import {IconSearch} from "@tabler/icons-react"
import {useThrottledCallback} from "@mantine/hooks"

export default function QuickFilter() {
  const throttledSetValue = useThrottledCallback(value => onChange(value), 1500)

  const onChange = (value: string) => {
    if (value && value.length > 1) {
      console.log(value)
    }
  }

  return (
    <TextInput
      rightSection={<IconSearch />}
      onChange={event => throttledSetValue(event.currentTarget.value)}
      placeholder="Quick search"
    />
  )
}
