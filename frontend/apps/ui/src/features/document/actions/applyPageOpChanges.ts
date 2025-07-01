import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/apiSlice" // make sure this exports your API slice
import {addClientDocVersion} from "@/features/document/documentVersSlice"
import {addImageObjectsFromPrevious} from "@/features/document/imageObjectsSlice"
import {DocumentVersion} from "@/features/document/types"
import {clientDVFromDV} from "@/features/document/utils"
import {currentDocVerUpdated} from "@/features/ui/uiSlice"
import type {ClientPage, PanelMode} from "@/types"
import {createAsyncThunk} from "@reduxjs/toolkit"

export const applyPageChangesThunk = createAsyncThunk<
  void, // return type
  {docID: string; pages: ClientPage[]; mode: PanelMode}, // argument type
  {state: RootState} // thunkAPI config
>("document/applyPageChanges", async ({docID, pages, mode}, {dispatch}) => {
  const pageData = pages.map(p => {
    const result = {
      angle: p.angle,
      page: {
        number: p.number,
        id: p.id
      }
    }
    return result
  })

  const result = await dispatch(
    apiSliceWithDocuments.endpoints.applyPageOpChanges.initiate({
      pages: pageData,
      documentID: docID
    })
  )

  if ("error" in result) {
    throw result.error
  }

  if (!result.data) {
    throw "No data"
  }

  let newDoc = result.data
  let lastVersion = getLastVersion(newDoc.versions)

  const updates = lastVersion.pages.map(lastVerPage => {
    const oldInfo = pageData[lastVerPage.number - 1]
    return {
      newPageID: lastVerPage.id,
      oldPageID: oldInfo.page.id,
      angle: oldInfo.angle,
      docVerID: lastVersion.id,
      docID: lastVersion.document_id,
      number: lastVersion.number
    }
  })

  dispatch(addImageObjectsFromPrevious({updates}))

  let ver = clientDVFromDV(lastVersion)

  dispatch(addClientDocVersion(ver))
  dispatch(currentDocVerUpdated({mode: mode, docVerID: lastVersion.id}))
})

function getLastVersion(docVers: DocumentVersion[]): DocumentVersion {
  if (docVers.length === 0) {
    throw new Error("No document versions available.")
  }

  return docVers.reduce((latest, current) =>
    current.number > latest.number ? current : latest
  )
}
