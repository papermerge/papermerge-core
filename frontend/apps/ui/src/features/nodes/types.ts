import type {NodeType} from "@/types"

export type UploadFileOutput = {
  source: NodeType | null
  target_id: string
  file_name: string
}
