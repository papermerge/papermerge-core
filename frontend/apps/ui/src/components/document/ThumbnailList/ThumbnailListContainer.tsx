import {Button, Stack} from "@mantine/core"
import {useState} from "react"

import {RootState} from "@/app/types"
import PanelContext from "@/contexts/PanelContext"
import {selectThumbnailsPanelOpen} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import {useContext} from "react"
import {useTranslation} from "react-i18next"
import {useSelector} from "react-redux"
import usePageList from "../PageList/usePageList"
import Thumbnail from "../Thumbnail"
import classes from "./ThumbnailListContainer.module.css"

export default function ThumbnailListContainer() {
  const {t} = useTranslation()
  const mode: PanelMode = useContext(PanelContext)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const {pages, showLoadMore} = usePageList({
    pageNumber: pageNumber,
    pageSize: 5
  })
  const sortedPages = pages.sort((a, b) => a.pageNumber - b.pageNumber)
  const thumbnailComponents = sortedPages.map(p => (
    <Thumbnail key={p.pageID} pageID={p.pageID} pageNumber={p.pageNumber} />
  ))
  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )

  // display: none
  if (thumbnailsIsOpen) {
    return (
      <Stack className={classes.thumbnails} justify="flex-start">
        {thumbnailComponents}
        {showLoadMore && (
          <Button size={"sm"} onClick={() => setPageNumber(pageNumber + 1)}>
            {t("load-more")}
          </Button>
        )}
      </Stack>
    )
  }

  return (
    <Stack
      style={{display: "none"}}
      className={classes.thumbnails}
      justify="flex-start"
    >
      {thumbnailComponents}
    </Stack>
  )
}
