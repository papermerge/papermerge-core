import {Loader, Stack} from "@mantine/core"
import {useContext, useMemo} from "react"

import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import type {PanelMode} from "@/types"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./Pages.module.css"

import {selectCurrentDocumentVersionNumber} from "@/features/document/selectors"

import {useGetDocumentQuery} from "@/features/document/apiSlice"

import {selectCurrentNodeID} from "@/features/ui/uiSlice"

export default function Pages() {
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {data: doc, isLoading} = useGetDocumentQuery(currentNodeID!)
  const currDocumentVersionNumber = useAppSelector(s =>
    selectCurrentDocumentVersionNumber(s, mode)
  )
  const docVersion = useMemo(() => {
    if (!doc) {
      return null
    }
    let maxVerNum = currDocumentVersionNumber

    if (!maxVerNum) {
      maxVerNum = Math.max(...doc.versions.map(v => v.number))
    }

    return doc.versions.find(v => v.number == maxVerNum)
  }, [doc, currDocumentVersionNumber])

  if (isLoading) {
    return <Loader />
  }

  if (!docVersion) {
    return <Loader />
  }

  const pages = docVersion.pages.map(p => (
    <Page key={p.id} page={{page: p, angle: 0}} />
  ))

  return (
    <Stack justify="center" className={classes.pages}>
      {pages}
      <Zoom />
    </Stack>
  )
}
