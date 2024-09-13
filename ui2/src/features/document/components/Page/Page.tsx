import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useGetPageImageQuery} from "@/features/document/apiSlice"
import {selectCurrentNodeID, selectZoomFactor} from "@/features/ui/uiSlice"
import {selectDocumentCurrentPage} from "@/slices/dualPanel/dualPanel"
import {ClientPage, PanelMode} from "@/types"
import {Stack} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"

import {
  pageAdded,
  selectPageMemoryData
} from "@/features/document/documentSlice"

import classes from "./Page.module.css"
type Args = {
  page: ClientPage
}

export default function Page({page}: Args) {
  const dispatch = useAppDispatch()
  const {data, isFetching, isSuccess} = useGetPageImageQuery(page.id)
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useAppSelector(s => selectDocumentCurrentPage(s, mode))
  const targetRef = useRef<HTMLImageElement | null>(null)
  const zoomFactor = useAppSelector(s => selectZoomFactor(s, mode))
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const pageMemoryData = useAppSelector(s =>
    selectPageMemoryData(s, docID!, page.number)
  )

  useEffect(() => {
    if (currentPage == page.number) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView(false)
      }
    }
  }, [currentPage, data, page.number])

  useEffect(() => {
    if (isSuccess && page.number && docID) {
      dispatch(
        pageAdded({
          documentID: docID!,
          pageNumber: page.number,
          angle: page.angle,
          data
        })
      )
    }
  }, [isSuccess, page.angle])

  if (isFetching && pageMemoryData) {
    return (
      <Stack className={classes.page}>
        <img
          style={{
            transform: `rotate(${pageMemoryData.angle}deg)`,
            width: `${zoomFactor}%`,
            opacity: 0.75,
            filter: "blur(4px)"
          }}
          ref={targetRef}
          src={pageMemoryData.data}
        />
        <div>{page.number}</div>
      </Stack>
    )
  }

  return (
    <Stack className={classes.page}>
      <img
        style={{transform: `rotate(${page.angle}deg)`, width: `${zoomFactor}%`}}
        ref={targetRef}
        src={data}
      />
      <div>{page.number}</div>
    </Stack>
  )
}
