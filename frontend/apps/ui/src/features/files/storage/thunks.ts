import {fileManager} from "@/features/files/fileManager"
import {
  fileAdded,
  uploadFailed,
  uploadProgressUpdated,
  uploadStarted,
  uploadSucceeded
} from "@/features/files/storage/files"
import type {NodeType} from "@/types"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {createAsyncThunk} from "@reduxjs/toolkit"
import axios, {AxiosError} from "axios"

type UploadFileInput = {
  file: File
  target_id: string
  ocr: boolean
  lang: string
}

type UploadFileOutput = {
  success: boolean
  node?: NodeType
  error?: string
}

export const uploadFile = createAsyncThunk<UploadFileOutput, UploadFileInput>(
  "files/upload",
  async (args: UploadFileInput, {dispatch, rejectWithValue}) => {
    const {file, target_id, ocr, lang} = args
    const baseUrl = getBaseURL()
    const defaultHeaders = getDefaultHeaders()

    // Start upload tracking
    dispatch(uploadStarted({targetId: target_id, fileName: file.name}))

    // Prepare FormData
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", file.name)
    formData.append("parent_id", target_id)
    if (lang) {
      formData.append("lang", lang)
    }
    formData.append("ocr", ocr.toString())

    const uploadURL = `${baseUrl}/api/documents/upload`

    try {
      // Upload with progress tracking
      const response = await axios.post<NodeType>(uploadURL, formData, {
        headers: {
          ...defaultHeaders,
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            dispatch(
              uploadProgressUpdated({
                targetId: target_id,
                fileName: file.name,
                progress
              })
            )
          }
        }
      })

      // Check for HTTP errors
      if (response.status >= 400) {
        const errorMsg = `${response.status} ${response.statusText}: ${
          (response.data as any)?.detail || "Upload failed"
        }`

        dispatch(
          uploadFailed({
            targetId: target_id,
            fileName: file.name,
            error: errorMsg
          })
        )

        return rejectWithValue(errorMsg)
      }

      // Success - store file in memory and update state
      const createdNode = response.data
      const buffer = await file.arrayBuffer()

      fileManager.store({
        nodeID: createdNode.id,
        buffer: buffer
      })

      dispatch(
        fileAdded({
          nodeID: createdNode.id,
          objectURL: URL.createObjectURL(file),
          fileName: file.name,
          size: file.size,
          type: file.type
        })
      )

      dispatch(
        uploadSucceeded({
          targetId: target_id,
          fileName: file.name,
          node: createdNode
        })
      )

      return {success: true, node: createdNode}
    } catch (error: unknown) {
      // Handle network errors or other exceptions
      let errorMsg = "Upload failed. Network error or invalid URL."

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{detail?: string}>
        errorMsg = axiosError.response?.data?.detail || axiosError.message
      } else if (error instanceof Error) {
        errorMsg = error.message
      }

      console.error(`Error uploading file to ${uploadURL}:`, error)

      dispatch(
        uploadFailed({
          targetId: target_id,
          fileName: file.name,
          error: errorMsg
        })
      )

      return rejectWithValue(errorMsg)
    }
  }
)
