import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/store/apiSlice" // make sure this exports your API slice
import {DocSliceEntity, upsertDoc} from "@/features/document/store/docsSlice"
import {addClientDocVersion} from "@/features/document/store/documentVersSlice"
import {addImageObjects} from "@/features/document/store/imageObjectsSlice"
import {DocumentVersion} from "@/features/document/types"
import {clientDVFromDV} from "@/features/document/utils"
import {currentDocVerUpdated, secondaryPanelClosed} from "@/features/ui/uiSlice"
import type {ExtractPagesType, PanelMode} from "@/types"
import {UUID} from "@/types.d/common"
import {t} from "@/utils/i18nHelper"
import {notifications} from "@mantine/notifications"
import {createAsyncThunk} from "@reduxjs/toolkit"
import type {NavigateFunction} from "react-router-dom"

export const extractPages = createAsyncThunk<
  void, // return type
  {
    extractPagesData: ExtractPagesType
    sourceMode: PanelMode
    navigate: NavigateFunction
  }, // argument type
  {state: RootState} // thunkAPI config
>("document/extractPages", async (inputArgs, {dispatch, getState}) => {
  const state = getState()

  const sourcePageData = getSourceOrderedPageIDs({
    docID: inputArgs.extractPagesData.sourceDocID,
    movedOutPageIDs: inputArgs.extractPagesData.body.source_page_ids,
    state
  })

  const result = await dispatch(
    apiSliceWithDocuments.endpoints.extractPages.initiate(
      inputArgs.extractPagesData
    )
  )

  if ("error" in result) {
    throw result.error
  }

  if (!result.data) {
    throw "No data"
  }

  let {source} = result.data
  let lastVersionSource = getLastVersion(source?.versions)

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
      dispatch(secondaryPanelClosed())
    } else {
      // Pages extracted in "secondary" panel
      // In this we change to main panel whatever was in secondary
      // i.e. document from the secondary panel will be displayed
      // in main
      inputArgs.navigate(
        `/folder/${inputArgs.extractPagesData.sourceDocParentID}`
      )
      // and because secondary panel contains a document which just got deleted,
      // we close it
      dispatch(secondaryPanelClosed())
    }
    // invalidate
    dispatch(
      apiSliceWithDocuments.util.invalidateTags([
        {type: "Node", id: inputArgs.extractPagesData.sourceDocParentID}
      ])
    )
    // ...existing code...
  }
})

function getLastVersion(
  docVers?: DocumentVersion[]
): DocumentVersion | undefined {
  if (!docVers) {
    return undefined
  }

  if (docVers.length === 0) {
    return undefined
  }

  return docVers.reduce((latest, current) =>
    current.number > latest.number ? current : latest
  )
}

interface GetSourceOldPageID {
  docID: UUID
  movedOutPageIDs: UUID[]
  state: RootState
}

function getSourceOrderedPageIDs({
  docID,
  movedOutPageIDs,
  state
}: GetSourceOldPageID): UUID[] {
  const docVerID = state.docs.entities[docID]?.latestDocVer?.docVerID
  if (!docVerID) {
    console.error(`getSourcePageID: docVerID=${docVerID}} not found`)
    return []
  }

  const pages = state.docVers.entities[docVerID].pages
  if (!pages) {
    console.error(`getSourcePageID: empty pages`)
    return []
  }

  const pagesSortedByNumber = pages.slice().sort((a, b) => a.number - b.number)
  const withoutMovedOutPages = pagesSortedByNumber.filter(
    p => !movedOutPageIDs.includes(p.id)
  )

  return withoutMovedOutPages.map(p => p.id)
}
