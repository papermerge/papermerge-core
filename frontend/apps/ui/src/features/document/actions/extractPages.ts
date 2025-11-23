import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/store/apiSlice" // make sure this exports your API slice
import {DocSliceEntity, upsertDoc} from "@/features/document/store/docsSlice"
import {addClientDocVersion} from "@/features/document/store/documentVersSlice"
import {addImageObjects} from "@/features/document/store/imageObjectsSlice"
import {clientDVFromDV} from "@/features/document/utils"
import {closePanel} from "@/features/ui/panelRegistry"
import {
  currentDocVerUpdated,
  viewerSelectionCleared
} from "@/features/ui/uiSlice"
import type {ExtractPagesType, PanelMode} from "@/types"

import {t} from "@/utils/i18nHelper"
import {otherMode} from "@/utils/mode"
import {notifications} from "@mantine/notifications"
import {createAsyncThunk} from "@reduxjs/toolkit"
import type {NavigateFunction} from "react-router-dom"
import {getLastVersion, getSourceOrderedPageIDs} from "./utils"

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

    dispatch(viewerSelectionCleared(otherMode(inputArgs.sourceMode)))

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
      // Pages extracted in "secondary" panel
      // In this we change to main panel whatever was in secondary
      // i.e. document from the secondary panel will be displayed
      // in main
      inputArgs.navigate(
        `/folder/${inputArgs.extractPagesData.body.target_folder_id}`
      )
      // and because secondary panel contains a document which just got deleted,
      // we close it
      dispatch(closePanel({panelId: "secondary"}))
    }

    dispatch(
      apiSliceWithDocuments.util.invalidateTags([
        {type: "Node", id: inputArgs.extractPagesData.sourceDocParentID}
      ])
    )
  }
})
