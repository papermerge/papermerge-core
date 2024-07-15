import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"

import axios from "axios"
import {RootState} from "@/app/types"
import type {FolderType, FileItemType, NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"

export type UploaderState = {
  opened: boolean
  files: Array<FileItemType>
}

const initialState: UploaderState = {
  files: [
    {status: "pending", error: null, name: "coco.pdf", target: "home"},
    {status: "pending", error: null, name: "jumbo.pdf", target: "home"},
    {status: "pending", error: null, name: "momo.pdf", target: "home"}
  ],
  opened: true
}

const uploaderSlice = createSlice({
  name: "uploader",
  initialState,
  reducers: {
    closeUploader: state => {
      state.opened = false
    },
    openUploader: state => {
      state.opened = true
    }
  },
  extraReducers(builder) {}
})

export default uploaderSlice.reducer
export const {openUploader, closeUploader} = uploaderSlice.actions

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

export const uploadFile = createAsyncThunk<NodeType, UploadFileInput>(
  "group/fetchGroupDetails",
  async (args: UploadFileInput) => {
    const baseUrl = getBaseURL()
    let defaultHeaders = getDefaultHeaders()
    const data1: CreateDocumentType = {
      title: args.file.name,
      parent_id: args.target.id,
      ctype: "document",
      ocr: !args.skipOCR
    }

    const response1 = await axios.post(`${baseUrl}api/nodes/`, data1, {
      headers: defaultHeaders
    })
    const createdNode = response1.data as NodeType
    const form_data = new FormData()

    form_data.append("file", args.file)

    defaultHeaders["Content-Type"] = "multipart/form-data"

    const response2 = await axios.post(
      `${baseUrl}api/documents/${createdNode.id}/upload`,
      form_data,
      {headers: defaultHeaders}
    )

    return createdNode
  }
)
