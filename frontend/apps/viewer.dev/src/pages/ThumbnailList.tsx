import {Checkbox, Group, Stack} from "@mantine/core"
import {useState} from "react"
import {Thumbnail, ThumbnailList} from "viewer"
import page_a_sm from "../assets/pages/page_a/sm.jpg"
import classes from "./ThumbnailListContainer.module.css"

export default function ThumbnailListPage() {
  const [paginationInProgress, setPaginationInProgress] =
    useState<boolean>(false)
  const [paginationFirstPageIsReady, setPaginationFirstPageIsReady] =
    useState<boolean>(false)

  const togglePaginationInProgress = () => {
    setPaginationInProgress(!paginationInProgress)
  }

  const togglePaginationFirstPageIsReady = () => {
    setPaginationFirstPageIsReady(!paginationFirstPageIsReady)
  }

  const pages = [1, 2, 3, 4].map(i => (
    <Thumbnail key={i} pageNumber={i} imageURL={page_a_sm} isLoading={false} />
  ))

  return (
    <Stack className={`${classes.thumbnailList} ${classes.container}`}>
      <Group>
        <Checkbox label="Loading Pages" onClick={togglePaginationInProgress} />
        <Checkbox
          label="paginationFirstPageIsReady"
          onClick={togglePaginationFirstPageIsReady}
        />
      </Group>
      <ThumbnailList
        thumbnailItems={pages}
        paginationInProgress={paginationInProgress}
        paginationFirstPageIsReady={paginationFirstPageIsReady}
      />
    </Stack>
  )
}
