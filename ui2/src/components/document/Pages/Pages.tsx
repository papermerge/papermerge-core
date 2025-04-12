import {useAppSelector} from "@/app/hooks"
import {Loader, Stack} from "@mantine/core"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {selectAllPages} from "@/features/document/documentVersSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./Pages.module.css"

export default function Pages() {
  const mode: PanelMode = useContext(PanelContext)
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {isFetching} = useGetDocumentQuery(currentNodeID!)

  const pageComponents = pages.map(p => <Page key={p.id} page={p} />)

  if (isFetching) {
    return (
      <Stack justify="center" align="center" className={classes.loader}>
        <Loader type="bars" color="white" />
      </Stack>
    )
  }

  return (
    <Stack justify="center" className={classes.pages}>
      {pageComponents}
      <Zoom />
    </Stack>
  )
}
