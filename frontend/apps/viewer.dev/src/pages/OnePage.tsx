import {Checkbox, Group, Stack} from "@mantine/core"
import {Page} from "@papermerge/viewer"
import {useState} from "react"
import page_a_md from "../assets/pages/page_a/md.jpg"

export default function OnePage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const toggleIsLoading = () => {
    setIsLoading(!isLoading)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Is Loading" onClick={toggleIsLoading} />
      </Group>
      <Page pageNumber={1} imageURL={page_a_md} isLoading={isLoading} />
      <Page pageNumber={2} imageURL={page_a_md} isLoading={isLoading} />
    </Stack>
  )
}
