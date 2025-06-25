import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {UUID} from "@/types.d/common"
import {Button, Stack} from "@mantine/core"

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
  const {pages, isLoading, showLoadMore} = usePageList({
    docVerID,
    totalCount: 5,
    pageNumber: pageNumber,
    pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE
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
      <Stack className={classes.thumbnails} justify="flex-start">
        {thumbnailComponents}
        {showLoadMore && (
          <Button size={"sm"} disabled={isLoading} onClick={onLoadMore}>
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
