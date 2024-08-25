import {useEffect, useContext, useRef} from "react"
import {useSelector} from "react-redux"
import {Stack} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"
import {
  selectDocumentCurrentPage,
  selectZoomFactor
} from "@/slices/dualPanel/dualPanel"
import {PageAndRotOp, PanelMode} from "@/types"
import {useProtectedJpg} from "@/hooks/protected_image"
import {RootState} from "@/app/types"
import classes from "./Page.module.css"

type Args = {
  page: PageAndRotOp
}

export default function Page({page}: Args) {
  const protectedImage = useProtectedJpg(page.page.jpg_url)
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
  }, [currentPage, protectedImage, page.page.number])

  return (
    <Stack className={classes.page}>
      <img
        style={{transform: `rotate(${page.angle}deg)`, width: `${zoomFactor}%`}}
        ref={targetRef}
        src={protectedImage.data || ""}
      />
      <div>{page.page.number}</div>
    </Stack>
  )
}
