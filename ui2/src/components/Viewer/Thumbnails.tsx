import {Stack} from "@mantine/core"

import {selectDocumentCurrentVersion} from "@/slices/dualPanel/dualPanel"
import {useSelector} from "react-redux"
import {useContext} from "react"
import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"
import {RootState} from "@/app/types"
import Thumbnail from "./Thumbnail"

export default function Thumbnails() {
  const mode: PanelMode = useContext(PanelContext)
  const docVersion = useSelector((state: RootState) =>
    selectDocumentCurrentVersion(state, mode)
  )

  const pages = docVersion?.pages.map(p => <Thumbnail page={p} />)

  return <Stack justify="flex-start">{pages}</Stack>
}
