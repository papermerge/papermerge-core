import {Stack} from "@mantine/core"
import {useContext} from "react"

import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./Pages.module.css"

import {selectAllPages} from "@/features/document/documentVersSlice"

export default function Pages() {
  const mode: PanelMode = useContext(PanelContext)
  const allPages = useAppSelector(s => selectAllPages(s, mode)) || []

  const pages = allPages.map(p => <Page key={p.id} page={p} />)

  return (
    <Stack justify="center" className={classes.pages}>
      {pages}
      <Zoom />
    </Stack>
  )
}
