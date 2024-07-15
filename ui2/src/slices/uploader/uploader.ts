import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"

import axios from "axios"
import {RootState} from "@/app/types"
import type {FolderType, FileItemType, NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import type {UploadFileOutput} from "./types"

export type UploaderState = {
  opened: boolean
  files: Array<FileItemType>
}

const initialState: UploaderState = {
  files: [],
  opened: false
}

type NodeCreatedArg = {
  source: NodeType
  target: FolderType
  file_name: string
}

const uploaderSlice = createSlice({
  name: "uploader",
  initialState,
  reducers: {
    closeUploader: state => {
      state.opened = false
      state.files = []
    },
    openUploader: state => {
      state.opened = true
    },
    nodeCreated: (state, action: PayloadAction<NodeCreatedArg>) => {
      state.opened = true
      state.files.push({
        status: "uploading",
        error: null,
        file_name: action.payload.file_name,
        source: action.payload.source,
        target: action.payload.target
      })
    }
  },
  extraReducers(builder) {
    builder.addCase(uploadFile.pending, (state, {payload}) => {})
    builder.addCase(uploadFile.fulfilled, (state, {payload}) => {
      // mark file item as green
      console.log("upload complete!")
    })
    builder.addCase(uploadFile.rejected, (state, {payload}) => {
      // mark file item as red
    })
  }
})

export default uploaderSlice.reducer
export const {openUploader, closeUploader, nodeCreated} = uploaderSlice.actions

export const selectOpened = (state: RootState): boolean => state.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.uploader.files

type UploadFileInput = {
  file: File
  refreshTarget: boolean
  target: FolderType
  skipOCR: boolean
}

type CreateDocumentType = {
  title: string
  parent_id: string
  ctype: "document"
  ocr: boolean
}

export const uploadFile = createAsyncThunk<UploadFileOutput, UploadFileInput>(
  "upload/file",
  async (args: UploadFileInput, thunkApi) => {
    const baseUrl = getBaseURL()
    let defaultHeaders = getDefaultHeaders()
    const data1: CreateDocumentType = {
      title: args.file.name,
      parent_id: args.target.id,
      ctype: "document",
      ocr: !args.skipOCR
    }

    console.log("creating node...")
    const response1 = await axios.post(`${baseUrl}api/nodes/`, data1, {
      headers: defaultHeaders
    })
    const createdNode = response1.data as NodeType
    console.log("node was created")
    const form_data = new FormData()

    form_data.append("file", args.file)

    console.log("dispatch nodeCreated")
    thunkApi.dispatch(
      nodeCreated({
        source: createdNode,
        target: args.target,
        file_name: args.file.name
      })
    )

    defaultHeaders["Content-Type"] = "multipart/form-data"
    console.log("upload file")
    const response2 = await axios.post(
      `${baseUrl}api/documents/${createdNode.id}/upload`,
      form_data,
      {headers: defaultHeaders}
    )
    console.log("file upload ready")
    return {
      file_name: args.file.name,
      source: createdNode,
      target: args.target
    }
  }
)
