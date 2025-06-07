import {MantineProvider} from "@mantine/core"
import "./App.css"
import page_a_md from "./assets/pages/page_a/md.jpg"
import Page from "./components/Page"

function App() {
  return (
    <>
      <MantineProvider>
        <Page pageNumber={1} imageURL={page_a_md} isLoading={false} />
      </MantineProvider>
    </>
  )
}

export default App
