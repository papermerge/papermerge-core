import {useEffect, useContext, useRef} from "react"
import {useSelector} from "react-redux"
import {Stack} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"

import {useProtectedJpg} from "@/hooks/protected_image"
import {selectDocumentCurrentPage} from "@/slices/dualPanel/dualPanel"
import type {PanelMode, PageType} from "@/types"
import {RootState} from "@/app/types"

type Args = {
  page: PageType
}

export default function Thumbnail({page}: Args) {
  const protectedImage = useProtectedJpg(page.jpg_url)
  const mode: PanelMode = useContext(PanelContext)
  const currentPage = useSelector((state: RootState) =>
    selectDocumentCurrentPage(state, mode)
  )
  const targetRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (currentPage == page.number) {
      if (targetRef.current) {
        targetRef.current.scrollIntoView()
      }
    }
  }, [page.number, protectedImage.data])

  return (
    <Stack align="center">
      <img ref={targetRef} src={protectedImage.data || ""} />
      {page.number}
    </Stack>
  )
}
