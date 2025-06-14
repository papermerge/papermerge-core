// src/store/documentSlice.ts
import {RootState} from "@/app/types"
import axios from "@/httpClient"
import {getBaseURL} from "@/utils"
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

interface DocumentState {
  loadingById: Record<string, boolean>
  errorById: Record<string, string | null>
}

const initialState: DocumentState = {
  loadingById: {},
  errorById: {}
}

export const fetchAndDownloadDocument = createAsyncThunk<
  void,
  string,
  {rejectValue: string; state: {documentDownloads: DocumentState}}
>(
  "document/fetchAndDownloadDocument",
  async (docVerId, {rejectWithValue, getState}) => {
    const state = getState() as RootState
    try {
      const response = await axios.get<{downloadURL: string}>(
        `/api/document-versions/${docVerId}/download-url`
      )
      const downloadURL = response.data.downloadURL
      let url

      if (downloadURL && !downloadURL.startsWith("/api/")) {
        // cloud URL e.g. aws cloudfront URL
        url = downloadURL
      } else {
        // use backend server URL (which may differ from frontend's URL)
        url = `${getBaseURL(true)}${downloadURL}`
      }

      // Second: Fetch the actual file as blob
      const fileResponse = await axios.get(url, {
        responseType: "blob"
      })

      let filename
      const docVer = state.docVers.entities[docVerId]

      if (docVer && docVer.file_name) {
        filename = docVer.file_name
      } else {
        filename = `document-${docVerId}.pdf`
      }

      // Third: Create blob URL and trigger download
      const blob = new Blob([fileResponse.data])
      const blobUrl = window.URL.createObjectURL(blob)

      const anchor = document.createElement("a")
      anchor.href = blobUrl
      anchor.setAttribute("download", filename)
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      window.URL.revokeObjectURL(blobUrl) // Cleanup
    } catch (err: any) {
      return rejectWithValue(err.message || "Download failed")
    }
  },
  {
    condition: (docVerId, {getState}) => {
      const {loadingById} = getState().documentDownloads
      if (loadingById[docVerId]) {
        // Prevent duplicate dispatch if already downloading
        return false
      }
      return true
    }
  }
)

const documentDownloadsSlice = createSlice({
  name: "documentDownloads",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAndDownloadDocument.pending, (state, action) => {
        const docVerId = action.meta.arg
        state.loadingById[docVerId] = true
        state.errorById[docVerId] = null
      })
      .addCase(fetchAndDownloadDocument.fulfilled, (state, action) => {
        const docVerId = action.meta.arg
        state.loadingById[docVerId] = false
      })
      .addCase(fetchAndDownloadDocument.rejected, (state, action) => {
        const docVerId = action.meta.arg
        state.loadingById[docVerId] = false
        state.errorById[docVerId] = action.payload || "Unknown error"
      })
  }
})

export default documentDownloadsSlice.reducer
export type {DocumentState}
