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
      // Extract filename from Content-Disposition header
      let filename = extractFilenameFromHeader(
        fileResponse.headers["content-disposition"]
      )

      // Fallback to Redux state or default
      if (!filename) {
        const docVer = state.docVers.entities[docVerId]
        filename = docVer?.file_name || `document-${docVerId}.pdf`
      }

      // Get content type for proper blob creation
      const contentType =
        fileResponse.headers["content-type"] || "application/octet-stream"

      // Third: Create blob URL and trigger download
      const blob = new Blob([fileResponse.data], {type: contentType})
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

// Helper function to extract filename from Content-Disposition header
function extractFilenameFromHeader(
  contentDisposition: string | undefined
): string | null {
  if (!contentDisposition) return null

  // Try to match filename*=UTF-8''encoded_filename first (for unicode filenames)
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      // If decoding fails, continue to ASCII filename
    }
  }

  // Try to match filename="ascii_filename"
  const asciiMatch = contentDisposition.match(/filename="([^"]+)"/)
  if (asciiMatch) {
    return asciiMatch[1]
  }

  // Try to match filename=unquoted_filename
  const unquotedMatch = contentDisposition.match(/filename=([^;]+)/)
  if (unquotedMatch) {
    return unquotedMatch[1].trim()
  }

  return null
}

export default documentDownloadsSlice.reducer
export type {DocumentState}
