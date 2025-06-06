import { useAppSelector } from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import { selectBestImageByPageId } from "@/features/document/selectors"
import {
  selectDocumentCurrentPage,
  selectZoomFactor
} from "@/features/ui/uiSlice"
import { PanelMode } from "@/types"
import { Skeleton, Stack } from "@mantine/core"
import { useContext, useEffect, useRef } from "react"

import classes from "./Page.module.css"
interface Args {
  page_number: number
  page_id: string
}

export default function Page({page_number, page_id}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useAppSelector(s => selectDocumentCurrentPage(s, mode))
  const targetRef = useRef<HTMLImageElement | null>(null)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const bestImageURL = useAppSelector(s => selectBestImageByPageId(s, page_id))

  useEffect(() => {
    if (currentPage == page_number) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView(false)
      }
    }
  }, [currentPage, bestImageURL, page_number])

  if (!bestImageURL) {
    return (
      <Stack justify="center" align="center">
        <Skeleton width={"80%"} height={800} />
        <div>{page_number}</div>
      </Stack>
    )
  }

  return (
    <Stack className={classes.page}>
      <img
        /* style={{transform: `rotate(${page.angle}deg)`, width: `${zoomFactor}%`}} */
        ref={targetRef}
        src={bestImageURL}
      />
      <div>{page_number}</div>
    </Stack>
  )
}
