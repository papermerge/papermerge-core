import {Checkbox, Group, Stack} from "@mantine/core"
import {useState} from "react"
import {Page, PageList, Zoom} from "viewer"
import page_a_md from "../assets/pages/page_a/md.jpg"
import classes from "./PageListContainer.module.css"

export default function PageListPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const toggleIsLoading = () => {
    setIsLoading(!isLoading)
  }

  const pages = [1, 2, 3, 4].map(i => (
    <Page key={i} pageNumber={i} imageURL={page_a_md} isLoading={false} />
  ))

  return (
    <Stack className={`${classes.pageList} ${classes.container}`}>
      <Group>
        <Checkbox label="Loading Pages" onClick={toggleIsLoading} />
      </Group>
      <PageList pageItems={pages} zoom={<Zoom />} pagesAreLoading={isLoading} />
    </Stack>
  )
}
