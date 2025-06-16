import {
  Checkbox,
  ComboboxItem,
  Divider,
  Group,
  Select,
  Stack
} from "@mantine/core"
import {Thumbnail} from "@papermerge/viewer"
import {useState} from "react"
import page_a_sm from "../assets/pages/page_a/sm.jpg"

export default function OneThumbnail() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isDragged, setIsDragged] = useState<boolean>(false)
  const [angle, setAngle] = useState<number>(0)
  const [withBorderBottom, setWithBorderBottom] = useState<boolean>(false)
  const [withBorderTop, setWithBorderTop] = useState<boolean>(false)

  const toggleIsLoading = () => {
    setIsLoading(!isLoading)
  }

  const toggleIsChecked = () => {
    setIsChecked(!isChecked)
  }

  const toggleIsDragged = () => {
    setIsDragged(!isDragged)
  }

  const toggleWithBorderBottom = () => {
    setWithBorderBottom(!withBorderBottom)
  }

  const toggleWithBorderTop = () => {
    setWithBorderTop(!withBorderTop)
  }

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value) {
      setAngle(parseInt(option.value))
    }
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Is Loading" onClick={toggleIsLoading} />
        <Checkbox label="Is Dragged" onClick={toggleIsDragged} />
        <Checkbox label="with Border Bottom" onClick={toggleWithBorderBottom} />
        <Checkbox label="with Border Top" onClick={toggleWithBorderTop} />
        <Select
          label="Angle"
          placeholder="Pick a value"
          data={["0", "90", "180", "270"]}
          onChange={onSelect}
        />
      </Group>
      <Divider />

      <Thumbnail
        pageNumber={1}
        imageURL={page_a_sm}
        isLoading={isLoading}
        isDragged={isDragged}
        checked={isChecked}
        angle={angle}
        onChange={toggleIsChecked}
        withBorderBottom={withBorderBottom}
        withBorderTop={withBorderTop}
      />
    </Stack>
  )
}
