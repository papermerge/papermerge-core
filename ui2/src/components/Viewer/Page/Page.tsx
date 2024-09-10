import {RootState} from "@/app/types"
import PanelContext from "@/contexts/PanelContext"
import {useGetPageImageQuery} from "@/features/pages/apiSlice"
import {
  selectDocumentCurrentPage,
  selectZoomFactor
} from "@/slices/dualPanel/dualPanel"
import {PageAndRotOp, PanelMode} from "@/types"
import {Stack} from "@mantine/core"
import {useContext, useEffect, useRef} from "react"
import {useSelector} from "react-redux"
import classes from "./Page.module.css"

type Args = {
  page: PageAndRotOp
}

export default function Page({page}: Args) {
  const {data} = useGetPageImageQuery(page.page.id)
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useSelector((state: RootState) =>
    selectDocumentCurrentPage(state, mode)
  )
  const targetRef = useRef<HTMLImageElement | null>(null)
  const zoomFactor = useSelector((state: RootState) =>
    selectZoomFactor(state, mode)
  )

  useEffect(() => {
    if (currentPage == page.page.number) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView(false)
      }
    }
  }, [currentPage, data, page.page.number])

  return (
    <Stack className={classes.page}>
      <img
        style={{transform: `rotate(${page.angle}deg)`, width: `${zoomFactor}%`}}
        ref={targetRef}
        src={data}
      />
      <div>{page.page.number}</div>
    </Stack>
  )
}
