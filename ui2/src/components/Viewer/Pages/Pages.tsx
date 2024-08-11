import {Stack} from "@mantine/core"

import {selectDocumentCurrentVersion} from "@/slices/dualPanel/dualPanel"
import {useSelector} from "react-redux"
import {useContext} from "react"
import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"
import {RootState} from "@/app/types"
import Zoom from "../Zoom"
import Page from "../Page"
import classes from "./Pages.module.css"

export default function Pages() {
  const mode: PanelMode = useContext(PanelContext)
  const docVersion = useSelector((state: RootState) =>
    selectDocumentCurrentVersion(state, mode)
  )

  const pages = docVersion?.pages.map(p => <Page key={p.id} page={p} />)

  return (
    <Stack justify="center" className={classes.pages}>
      {pages}
      <Zoom />
    </Stack>
  )
}
