import {useEffect, useContext, useRef} from "react"
import {useSelector, useDispatch} from "react-redux"
import {Stack} from "@mantine/core"
import PanelContext from "@/contexts/PanelContext"

import {useProtectedJpg} from "@/hooks/protected_image"
import {
  selectDocumentCurrentPage,
  setCurrentPage
} from "@/slices/dualPanel/dualPanel"
import type {PanelMode, PageType} from "@/types"
import {RootState} from "@/app/types"

type Args = {
  page: PageType
}

export default function Thumbnail({page}: Args) {
  const dispatch = useDispatch()
  const protectedImage = useProtectedJpg(page.jpg_url)
  const mode: PanelMode = useContext(PanelContext)

  const onClick = () => {
    dispatch(setCurrentPage({mode, page: page.number}))
  }

  return (
    <Stack align="center" onClick={onClick}>
      <img src={protectedImage.data || ""} />
      {page.number}
    </Stack>
  )
}
