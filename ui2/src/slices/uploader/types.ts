import type {NodeType, FolderType} from "@/types"

export type UploadFileOutput = {
  source: NodeType
  target: FolderType
  file_name: string
}
