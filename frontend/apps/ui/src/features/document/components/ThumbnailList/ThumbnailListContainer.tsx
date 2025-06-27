import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {UUID} from "@/types.d/common"
import {Stack} from "@mantine/core"
import {useRef} from "react"

import {RootState} from "@/app/types"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "@/features/document/constants"
import {
  docVerPaginationUpdated,
  selectDocVerPaginationPageNumber
} from "@/features/document/documentVersSlice"
import {selectThumbnailsPanelOpen} from "@/features/ui/uiSlice"
import usePanelMode from "@/hooks/usePanelMode"
import {useTranslation} from "react-i18next"
import {useSelector} from "react-redux"
import usePageList from "../PageList/usePageList"
import Thumbnail from "../Thumbnail"
import classes from "./ThumbnailListContainer.module.css"

interface Args {
  docVerID: UUID
}

export default function ThumbnailListContainer({docVerID}: Args) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const pageNumber = useAppSelector(s =>
    selectDocVerPaginationPageNumber(s, docVerID)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const {pages, isLoading, loadMore} = usePageList({
    docVerID,
    totalCount: 5,
    pageNumber: pageNumber,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
    containerRef: containerRef
  })
  const thumbnailComponents = pages.map(p => (
    <Thumbnail key={p.id} pageID={p.id} angle={p.angle} pageNumber={p.number} />
  ))
  const thumbnailsIsOpen = useSelector((state: RootState) =>
    selectThumbnailsPanelOpen(state, mode)
  )

  const onLoadMore = () => {
    if (docVerID) {
      dispatch(
        docVerPaginationUpdated({
          pageNumber: pageNumber + 1,
          pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
          docVerID: docVerID
        })
      )
    }
  }

  // display: none
  if (thumbnailsIsOpen) {
    return (
      <Stack
        ref={containerRef}
        className={classes.thumbnails}
        justify="flex-start"
      >
        {thumbnailComponents}
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
