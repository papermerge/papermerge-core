import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Loader, Stack} from "@mantine/core"
import {useContext, useEffect, useMemo} from "react"

import PanelContext from "@/contexts/PanelContext"
import {selectAllPages} from "@/features/document/documentVersSlice"
import {preloadProgressiveImages} from "@/features/document/imageObjectsSlice"
import usePageImagePolling from "@/hooks/PageImagePolling"
import type {PanelMode} from "@/types"
import type {ProgressiveImageInputType} from "@/types.d/page_image"

import Page from "../Page"
import Zoom from "../Zoom"
import classes from "./Pages.module.css"

interface Args {
  isFetching: boolean
}

export default function Pages({isFetching}: Args) {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []
  const pageIDs = useMemo(() => pages.map(p => p.id), [pages])
  const {previews} = usePageImagePolling(pageIDs, {
    pollIntervalMs: 4000,
    maxRetries: 10
  })

  const pageComponents = pages.map(p => <Page key={p.id} page={p} />)

  useEffect(() => {
    Object.entries(previews).forEach(([pageID, previews]) => {
      const entry: ProgressiveImageInputType = {
        page_id: pageID,
        previews: previews
      }
      dispatch(preloadProgressiveImages(entry))
    })
  }, [previews])

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
