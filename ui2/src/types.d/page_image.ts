import {UUID} from "./common"

export interface StatusForSize {
  status: PageImageStatus | null
  url: string | null
  size: PageImageSize
}

export type PageImageStatus = "pending" | "ready" | "failed"
export type PageImageSize = "sm" | "md" | "lg" | "xl"
export type PageImageDict = Record<UUID, Array<StatusForSize>>

export interface ProgressiveImageInputType {
  page_id: UUID
  previews: Array<StatusForSize>
}
