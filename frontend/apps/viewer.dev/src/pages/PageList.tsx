import {Checkbox, ComboboxItem, Group, Select, Stack} from "@mantine/core"
import {useState} from "react"
import {Page, PageList, Zoom} from "viewer"
import page_a_md from "../assets/pages/page_a/md.jpg"
import classes from "./PageListContainer.module.css"

export default function PageListPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [zoomFactor, setZoomFactor] = useState<number>(100)
  const toggleIsLoading = () => {
    setIsLoading(!isLoading)
  }

  const pages = [1, 2, 3, 4].map(i => (
    <Page
      key={i}
      pageNumber={i}
      imageURL={page_a_md}
      isLoading={false}
      zoomFactor={zoomFactor}
    />
  ))

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value) {
      setZoomFactor(parseInt(option.value))
    }
  }

  return (
    <Stack className={`${classes.pageList} ${classes.container}`}>
      <Group>
        <Checkbox label="Loading Pages" onClick={toggleIsLoading} />
        <Select
          label="Versions"
          placeholder="Pick a value"
          data={["100", "120", "150"]}
          onChange={onSelect}
        />
      </Group>
      <PageList pageItems={pages} zoom={<Zoom />} pagesAreLoading={isLoading} />
    </Stack>
  )
}
