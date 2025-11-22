import {RootState} from "@/app/types"
import type {NodeType} from "@/types"
import type {UUID} from "@/types.d/common"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"

export type UploadStatus = "idle" | "uploading" | "success" | "error"

export type UploadingFile = {
  fileName: string
  targetId: string
  status: UploadStatus
  progress?: number
  error?: string
  uploadedNode?: NodeType
}

export type FileItem = {
  nodeID: UUID
  fileName: string
  size: number
  type: string
  objectURL?: string
  docVerID?: UUID
}

export type FilesState = {
  files: Array<FileItem>
  uploads: Record<string, UploadingFile> // keyed by `${targetId}-${fileName}`
  uploaderOpened: boolean
}

const initialState: FilesState = {
  files: [],
  uploads: {},
  uploaderOpened: false
}

function getUploadKey(targetId: string, fileName: string): string {
  return `${targetId}::${fileName}`
}

export const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {
    fileAdded(state, action: PayloadAction<FileItem>) {
      state.files.push(action.payload)
    },

    uploadStarted(
      state,
      action: PayloadAction<{targetId: string; fileName: string}>
    ) {
      const {targetId, fileName} = action.payload
      const key = getUploadKey(targetId, fileName)

      state.uploads[key] = {
        fileName,
        targetId,
        status: "uploading",
        progress: 0
      }
      state.uploaderOpened = true
    },

    uploadProgressUpdated(
      state,
      action: PayloadAction<{
        targetId: string
        fileName: string
        progress: number
      }>
    ) {
      const {targetId, fileName, progress} = action.payload
      const key = getUploadKey(targetId, fileName)

      if (state.uploads[key]) {
        state.uploads[key].progress = progress
      }
    },

    uploadSucceeded(
      state,
      action: PayloadAction<{
        targetId: string
        fileName: string
        node: NodeType
      }>
    ) {
      const {targetId, fileName, node} = action.payload
      const key = getUploadKey(targetId, fileName)

      if (state.uploads[key]) {
        state.uploads[key].status = "success"
        state.uploads[key].uploadedNode = node
      }
    },

    uploadFailed(
      state,
      action: PayloadAction<{
        targetId: string
        fileName: string
        error: string
      }>
    ) {
      const {targetId, fileName, error} = action.payload
      const key = getUploadKey(targetId, fileName)

      if (state.uploads[key]) {
        state.uploads[key].status = "error"
        state.uploads[key].error = error
      }
    },

    uploaderClosed(state) {
      state.uploaderOpened = false
      // Optionally clear completed uploads
      Object.keys(state.uploads).forEach(key => {
        if (state.uploads[key].status !== "uploading") {
          delete state.uploads[key]
        }
      })
    },

    uploadRemoved(
      state,
      action: PayloadAction<{targetId: string; fileName: string}>
    ) {
      const {targetId, fileName} = action.payload
      const key = getUploadKey(targetId, fileName)
      delete state.uploads[key]
    }
  }
})

export default filesSlice.reducer
export const {
  fileAdded,
  uploadStarted,
  uploadProgressUpdated,
  uploadSucceeded,
  uploadFailed,
  uploaderClosed,
  uploadRemoved
} = filesSlice.actions

export const selectUploaderOpened = (state: RootState) =>
  state.files.uploaderOpened

export const selectUploads = (state: RootState) => state.files.uploads

export const selectUploadsList = (state: RootState) =>
  Object.values(state.files.uploads)

export const selectActiveUploadsCount = (state: RootState) =>
  Object.values(state.files.uploads).filter(u => u.status === "uploading")
    .length

export const selectUploadByKey = (
  state: RootState,
  targetId: string,
  fileName: string
) => {
  const key = `${targetId}::${fileName}`
  return state.files.uploads[key]
}
