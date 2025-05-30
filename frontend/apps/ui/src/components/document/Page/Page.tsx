import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {selectBestImageByPageId} from "@/features/document/selectors"
import {
  selectDocumentCurrentPage,
  selectZoomFactor
} from "@/features/ui/uiSlice"
import {ClientPage, PanelMode} from "@/types"
import {Skeleton, Stack} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"

import classes from "./Page.module.css"
type Args = {
  page: ClientPage
}

export default function Page({page}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useAppSelector(s => selectDocumentCurrentPage(s, mode))
  const targetRef = useRef<HTMLImageElement | null>(null)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const bestImageURL = useAppSelector(s => selectBestImageByPageId(s, page.id))

  useEffect(() => {
    if (currentPage == page.number) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView(false)
      }
    }
  }, [currentPage, bestImageURL, page.number])

  if (!bestImageURL) {
    return (
      <Stack justify="center" align="center">
        <Skeleton width={"80%"} height={800} />
        <div>{page.number}</div>
      </Stack>
    )
  }

  return (
    <Stack className={classes.page}>
      <img
        style={{transform: `rotate(${page.angle}deg)`, width: `${zoomFactor}%`}}
        ref={targetRef}
        src={bestImageURL}
      />
      <div>{page.number}</div>
    </Stack>
  )
}
