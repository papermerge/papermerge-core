import {Stack} from "@mantine/core"
import {PageType} from "@/types"
import {useProtectedJpg} from "@/hooks/protected_image"

type Args = {
  page: PageType
}

export default function Thumbnail({page}: Args) {
  const protectedImage = useProtectedJpg(page.jpg_url)

  return (
    <Stack align="center">
      <img src={protectedImage.data || ""} /> {page.number}
    </Stack>
  )
}
