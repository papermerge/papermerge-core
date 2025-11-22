import {fileManager} from "@/features/files/fileManager"
import {filesAdded} from "@/features/files/storage/files"
import {UploadFileOutput} from "@/features/nodes/types"
import {uploaderFileItemUpdated} from "@/features/ui/uiSlice"
import type {NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {createAsyncThunk} from "@reduxjs/toolkit"
import axios from "axios"

type FilesAddedType = {
  nodeID: string
  objectURL: string
  fileName: string
  type: string
  size: number
}

type UploadFileInput = {
  file: File
  refreshTarget: boolean
  target_id: string
  ocr: boolean
  lang: string
}

export const uploadFile = createAsyncThunk<UploadFileOutput, UploadFileInput>(
  "upload/file",
  async (args: UploadFileInput, thunkApi) => {
    const baseUrl = getBaseURL()
    let defaultHeaders = getDefaultHeaders()
    const buffer = await args.file.arrayBuffer()

    thunkApi.dispatch(
      uploaderFileItemUpdated({
        item: {
          source: null,
          target_id: args.target_id,
          file_name: args.file.name
        },
        status: "uploading",
        error: null
      })
    )

    // Prepare FormData with all required fields
    const formData = new FormData()
    formData.append("file", args.file)
    formData.append("title", args.file.name)
    formData.append("parent_id", args.target_id)
    if (args.lang) {
      formData.append("lang", args.lang)
    }
    formData.append("ocr", args.ocr.toString())

    defaultHeaders["Content-Type"] = "multipart/form-data"

    let response
    const uploadURL = `${baseUrl}/api/documents/upload`

    try {
      response = await axios.post(uploadURL, formData, {
        headers: defaultHeaders,
        validateStatus: () => true
      })
    } catch (error: unknown) {
      /* Will happen when uploadURL points to invalid location */
      console.error(`Error while uploading file to uploadURL=${uploadURL}`)
      console.error(error)
      thunkApi.dispatch(
        uploaderFileItemUpdated({
          item: {
            source: null,
            target_id: args.target_id,
            file_name: args.file.name
          },
          status: "failure",
          error: "Upload file error. See console for details"
        })
      )
      return {
        file_name: args.file.name,
        source: null,
        target_id: args.target_id
      }
    }

    if (response.status >= 400) {
      thunkApi.dispatch(
        uploaderFileItemUpdated({
          item: {
            source: null,
            target_id: args.target_id,
            file_name: args.file.name
          },
          status: "failure",
          error: `${response.status} ${response.statusText}: ${response.data?.detail}`
        })
      )
      return {
        file_name: args.file.name,
        source: null,
        target_id: args.target_id
      }
    }

    // Success - response contains the created document
    const createdNode = response.data as NodeType

    fileManager.store({
      nodeID: createdNode.id,
      buffer: buffer
    })

    thunkApi.dispatch(
      filesAdded({
        nodeID: createdNode.id,
        objectURL: URL.createObjectURL(args.file),
        fileName: args.file.name,
        size: args.file.size,
        type: args.file.type
      })
    )

    thunkApi.dispatch(
      uploaderFileItemUpdated({
        item: {
          source: createdNode,
          target_id: args.target_id,
          file_name: args.file.name
        },
        status: "success",
        error: null
      })
    )

    return {
      file_name: args.file.name,
      source: createdNode,
      target_id: args.target_id
    }
  }
)
