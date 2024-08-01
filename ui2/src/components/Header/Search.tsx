import {useState} from "react"
import {Input, CloseButton, rem} from "@mantine/core"
import {IconSearch} from "@tabler/icons-react"

export default function Search() {
  const [value, setValue] = useState("Clear me")

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const {key} = event

    if (key === "Enter") {
      console.log(`Enter pressed. Query = ${value}`)
    }
  }

  return (
    <Input
      placeholder="Search"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      leftSection={
        <IconSearch style={{width: rem(16), height: rem(16)}} stroke={1.5} />
      }
      rightSectionPointerEvents="all"
      mt="md"
      rightSection={
        <CloseButton
          aria-label="Clear input"
          onClick={() => setValue("")}
          style={{display: value ? undefined : "none"}}
        />
      }
    />
  )
}
