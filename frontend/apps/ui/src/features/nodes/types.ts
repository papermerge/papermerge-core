
import type { FolderType, NodeType } from "@/types"

export type UploadFileOutput = {
  source: NodeType | null
  target: FolderType
  file_name: string
}
