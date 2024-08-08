import {useEffect, useContext, useRef} from "react"
import {useSelector} from "react-redux"
import {Stack} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"
import {selectDocumentCurrentPage} from "@/slices/dualPanel/dualPanel"
import {PageType, PanelMode} from "@/types"
import {useProtectedJpg} from "@/hooks/protected_image"
import {RootState} from "@/app/types"

type Args = {
  page: PageType
}

export default function Page({page}: Args) {
  const protectedImage = useProtectedJpg(page.jpg_url)
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useSelector((state: RootState) =>
    selectDocumentCurrentPage(state, mode)
  )
  const targetRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (currentPage == page.number) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView(false)
      }
    }
  }, [currentPage, protectedImage, page.number])

  return (
    <Stack className="page" align="center">
      <img ref={targetRef} src={protectedImage.data || ""} /> {page.number}
    </Stack>
  )
}
