import {Checkbox, Divider, Group, Stack} from "@mantine/core"
import {Thumbnail} from "@papermerge/viewer"
import {useState} from "react"
import page_a_sm from "../assets/pages/page_a/sm.jpg"

export default function OneThumbnail() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [isDragged, setIsDragged] = useState<boolean>(false)
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

  return (
    <Stack>
      <Group>
        <Checkbox label="Is Loading" onClick={toggleIsLoading} />
        <Checkbox label="Is Dragged" onClick={toggleIsDragged} />
        <Checkbox label="with Border Bottom" onClick={toggleWithBorderBottom} />
        <Checkbox label="with Border Top" onClick={toggleWithBorderTop} />
      </Group>
      <Divider />

      <Thumbnail
        pageNumber={1}
        imageURL={page_a_sm}
        isLoading={isLoading}
        isDragged={isDragged}
        checked={isChecked}
        onChange={toggleIsChecked}
        withBorderBottom={withBorderBottom}
        withBorderTop={withBorderTop}
      />
    </Stack>
  )
}
