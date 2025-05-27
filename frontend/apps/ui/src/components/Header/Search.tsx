import {mainPanelSwitchedToSearchResults} from "@/features/ui/uiSlice"
import {CloseButton, Input, rem} from "@mantine/core"
import {IconSearch} from "@tabler/icons-react"
import {useState} from "react"
import {useDispatch} from "react-redux"

export default function Search() {
  const dispatch = useDispatch()
  const [value, setValue] = useState("")

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const {key} = event

    if (key === "Enter") {
      /*
      dispatch(
        fetchPaginatedSearchResults({
          query: value,
          page_number: 1,
          page_size: 10
        })
      )
      */
      dispatch(mainPanelSwitchedToSearchResults(value))
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
