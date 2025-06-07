import {Checkbox, Group, MantineProvider, Stack} from "@mantine/core"
import {Page} from "@papermerge/viewer"
import page_a_md from "./assets/pages/page_a/md.jpg"

function App() {
  return (
    <>
      <MantineProvider>
        <Stack>
          <Group>
            <Checkbox label="Is Loading" />
          </Group>
          <Page pageNumber={1} imageURL={page_a_md} isLoading={false} />
        </Stack>
      </MantineProvider>
    </>
  )
}

export default App
