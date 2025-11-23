import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/store/apiSlice" // make sure this exports your API slice
import {DocSliceEntity, upsertDoc} from "@/features/document/store/docsSlice"
import {addClientDocVersion} from "@/features/document/store/documentVersSlice"
import {addImageObjects} from "@/features/document/store/imageObjectsSlice"
import {clientDVFromDV} from "@/features/document/utils"
import {closePanel} from "@/features/ui/panelRegistry"
import {currentDocVerUpdated} from "@/features/ui/uiSlice"
import type {MovePagesType, PanelMode} from "@/types"
import {TransferStrategyType} from "@/types"
import {UUID} from "@/types.d/common"
import {t} from "@/utils/i18nHelper"
import {otherMode} from "@/utils/mode"
import {notifications} from "@mantine/notifications"
import {createAsyncThunk} from "@reduxjs/toolkit"
import type {NavigateFunction} from "react-router-dom"
import {getLastVersion, getSourceOrderedPageIDs} from "./utils"

export const transferPages = createAsyncThunk<
  void, // return type
  {
    movePagesData: MovePagesType
    sourceMode: PanelMode
    navigate: NavigateFunction
  }, // argument type
  {state: RootState} // thunkAPI config
>("document/transferPages", async (inputArgs, {dispatch, getState}) => {
  const state = getState()

  const sourcePageData = getSourceOrderedPageIDs({
    docID: inputArgs.movePagesData.sourceDocID,
    movedOutPageIDs: inputArgs.movePagesData.body.source_page_ids,
    state
  })
  const targetPageData = getTargetOrderedPageIDs({
    docID: inputArgs.movePagesData.targetDocID,
    movedInPageIDs: inputArgs.movePagesData.body.source_page_ids,
    strategy: inputArgs.movePagesData.body.move_strategy,
    targetPageID: inputArgs.movePagesData.body.target_page_id,
    state
  })
  const result = await dispatch(
    apiSliceWithDocuments.endpoints.movePages.initiate(inputArgs.movePagesData)
  )

  if ("error" in result) {
    throw result.error
  }

  if (!result.data) {
    throw "No data"
  }

  let {source, target} = result.data
  let lastVersionSource = getLastVersion(source?.versions)
  let lastVersionTarget = getLastVersion(target.versions)

  if (lastVersionSource) {
    const srcUpdates = lastVersionSource.pages.map(lastVerPage => {
      const oldPageID = sourcePageData[lastVerPage.number - 1]
      return {
        newPageID: lastVerPage.id,
        newPageNumber: lastVerPage.number,
        oldPageID: oldPageID,
        angle: 0,
        docVerID: lastVersionSource.id,
        docID: lastVersionSource.document_id
      }
    })
    dispatch(addImageObjects({updates: srcUpdates}))
    let ver = clientDVFromDV(lastVersionSource)
    dispatch(addClientDocVersion(ver))
    dispatch(
      currentDocVerUpdated({
        mode: inputArgs.sourceMode,
        docVerID: lastVersionSource.id
      })
    )
    const docSliceEntity: DocSliceEntity = {
      id: lastVersionSource.document_id,
      latestDocVer: {
        docVerID: lastVersionSource.id,
        number: lastVersionSource.number
      }
    }
    dispatch(upsertDoc(docSliceEntity))
    dispatch(
      apiSliceWithDocuments.util.invalidateTags([
        {type: "DocVersList", id: lastVersionSource.document_id}
      ])
    )
    notifications.show({
      withBorder: true,
      message: t("documentVersion.was-created", {
        versionNumber: lastVersionSource.number
      }),
      autoClose: 4000
    })
  } else {
    // source is None, which means all pages from the
    // source were transfered
    if (inputArgs.sourceMode == "main") {
      // page dropped in "main" panel.
      // Because in secondary panel there is a document which just got deleted,
      // thus we just close this panel
      dispatch(closePanel({panelId: "secondary"}))
    } else {
      // Page dropped in "secondary" panel
      // In this we change to main panel whatever was in secondary
      // i.e. document from the secondary panel will be displayed
      // in main
      inputArgs.navigate(`/document/${inputArgs.movePagesData.targetDocID}`)
      // and because secondary panel contains a document which just got deleted,
      // we close it
      dispatch(closePanel({panelId: "secondary"}))
    }

    dispatch(
      apiSliceWithDocuments.util.invalidateTags([
        {type: "Node", id: inputArgs.movePagesData.sourceDocParentID}
      ])
    )
  }

  if (!lastVersionTarget?.pages) {
    console.error("transferPages: lastVersionTarget.pages is empty")
    return
  }

  const dstUpdates = lastVersionTarget?.pages.map(lastVerPage => {
    const oldPageID = targetPageData[lastVerPage.number - 1]
    return {
      newPageID: lastVerPage.id,
      newPageNumber: lastVerPage.number,
      oldPageID: oldPageID,
      angle: 0,
      docVerID: lastVersionTarget.id,
      docID: lastVersionTarget.document_id
    }
  })
  dispatch(addImageObjects({updates: dstUpdates}))
  let ver = clientDVFromDV(lastVersionTarget)
  dispatch(addClientDocVersion(ver))
  dispatch(
    currentDocVerUpdated({
      mode: otherMode(inputArgs.sourceMode),
      docVerID: lastVersionTarget.id
    })
  )
  const docSliceEntity: DocSliceEntity = {
    id: lastVersionTarget.document_id,
    latestDocVer: {
      docVerID: lastVersionTarget.id,
      number: lastVersionTarget.number
    }
  }
  dispatch(upsertDoc(docSliceEntity))
  dispatch(
    apiSliceWithDocuments.util.invalidateTags([
      {type: "DocVersList", id: lastVersionTarget.document_id}
    ])
  )
  notifications.show({
    withBorder: true,
    message: t("documentVersion.was-created", {
      versionNumber: lastVersionTarget.number
    }),
    autoClose: 4000
  })
})

interface GetTargetOrderedPageIDs {
  docID: UUID
  movedInPageIDs: UUID[]
  targetPageID: UUID
  strategy: TransferStrategyType
  state: RootState
}

function getTargetOrderedPageIDs({
  docID,
  movedInPageIDs,
  targetPageID,
  strategy,
  state
}: GetTargetOrderedPageIDs): UUID[] {
  if (strategy == "replace") {
    return movedInPageIDs
  }

  const docVerID = state.docs.entities[docID]?.latestDocVer?.docVerID
  if (!docVerID) {
    console.error(`getTargetOrderedPageIDs: docVerID=${docVerID}} not found`)
    return []
  }

  const pages = state.docVers.entities[docVerID].pages
  if (!pages) {
    console.error(`getTargetOrderedPageIDs: empty pages`)
    return []
  }

  const pagesSortedByNumber = pages.slice().sort((a, b) => a.number - b.number)
  const origPageIDs = pagesSortedByNumber.map(p => p.id)
  let targetPageIndex = pagesSortedByNumber.findIndex(p => p.id == targetPageID)

  if (targetPageIndex < 0) {
    // fallback
    targetPageIndex = 0
    console.warn("getTargetOrderedPageIDs: falling back to targetPageIndex=0")
  }

  const firstPart = origPageIDs.slice(0, targetPageIndex - 1)
  const secondPart = origPageIDs.slice(targetPageIndex)
  const origPagesPlusMovedInPages = [
    ...firstPart,
    ...movedInPageIDs,
    ...secondPart
  ]

  return origPagesPlusMovedInPages
}
